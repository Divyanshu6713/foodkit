"""Build every Drishya brand asset from the approved logo.

    python brand/build_brand.py

Needs: pillow, numpy, potracer (pip install pillow numpy potracer) and a local
Chrome or Edge for SVG rasterisation. Writes to public/brand/ and src/app/.

The logo itself is never redrawn. The script only
- removes the white background (colour-to-alpha with coverage recovery, so the
  interior colours stay exact: #5170FF D, #1B75BC splash, neutral gradient),
- makes a dark-background variant by lightening the neutral ink only,
- traces the D and the splash drops so the icon uses the logo's own shapes.
"""
import os, re, shutil, subprocess, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import potrace

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "brand", "source", "drishya-logo-original.png")
PUB = os.path.join(ROOT, "public", "brand")
APP = os.path.join(ROOT, "src", "app")
os.makedirs(PUB, exist_ok=True)

BLUE, SPLASH, WHITE = "#5170FF", "#1B75BC", "#FFFFFF"
SITE_BG = (5, 8, 11)          # --bg in globals.css

# --------------------------------------------------------------------------
# 1. Logo: transparent (for light backgrounds) and dark-background variants
# --------------------------------------------------------------------------
im = np.array(Image.open(SRC).convert("RGB")).astype(np.float64)
ink = (255.0 - im).max(axis=2) / 255.0
peak = np.array(Image.fromarray((ink * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(7))) / 255.0
alpha = np.where(peak > 0.02, np.clip(ink / np.maximum(peak, 1e-6), 0, 1), 0.0)
alpha[ink < 0.012] = 0.0
a3 = alpha[..., None]
rgb = np.clip(np.where(a3 > 0.004, (im - 255.0 * (1 - a3)) / np.maximum(a3, 1e-6), 255.0), 0, 255)

ys, xs = np.where(alpha > 0.02)
pad = 28
x0, y0, x1, y1 = xs.min() - pad, ys.min() - pad, xs.max() + pad + 1, ys.max() + pad + 1
rgb, alpha = rgb[y0:y1, x0:x1], alpha[y0:y1, x0:x1]
H, W = alpha.shape

def save_logo(rgb_arr, name, width=960):
    img = Image.fromarray(np.dstack([rgb_arr, alpha * 255]).round().astype(np.uint8), "RGBA")
    img.resize((width, round(width * H / W)), Image.LANCZOS).save(os.path.join(PUB, name), optimize=True)

save_logo(rgb, "drishya-logo-transparent.png")
neutral = (rgb.max(axis=2) - rgb.min(axis=2)) < 24
light = 244.0 - rgb.mean(axis=2) * 0.85                  # black -> ~#F1F1F1, #6E6E6E -> ~#969696
dark_rgb = np.where(neutral[..., None], light[..., None].repeat(3, axis=2), rgb)
save_logo(dark_rgb, "drishya-logo-dark.png")
shutil.copy(SRC, os.path.join(PUB, "drishya-logo.png"))
print(f"logo {W}x{H} (aspect {W / H:.4f})")

# --------------------------------------------------------------------------
# 2. Trace the D and the splash drops
# --------------------------------------------------------------------------
def trace(mask):
    d = []
    for curve in potrace.Bitmap(~mask).trace(turdsize=40, alphamax=1.0, opticurve=True, opttolerance=0.2):
        s = curve.start_point
        d.append(f"M{s.x:.1f} {s.y:.1f}")
        for seg in curve.segments:
            if seg.is_corner:
                d.append(f"L{seg.c.x:.1f} {seg.c.y:.1f}L{seg.end_point.x:.1f} {seg.end_point.y:.1f}")
            else:
                d.append(f"C{seg.c1.x:.1f} {seg.c1.y:.1f} {seg.c2.x:.1f} {seg.c2.y:.1f} {seg.end_point.x:.1f} {seg.end_point.y:.1f}")
        d.append("Z")
    return "".join(d)

def near(col):
    return (np.abs(rgb - np.array(col)).max(axis=2) < 40) & (alpha > 0.5)

def bbox_of(d):
    n = list(map(float, re.findall(r"-?\d+\.?\d*", d)))
    return min(n[0::2]), min(n[1::2]), max(n[0::2]), max(n[1::2])

D = trace(near((81, 112, 255)))
SPL = trace(near((27, 117, 188)))
drops = sorted(re.findall(r"M[^M]*", SPL), key=lambda p: bbox_of(p)[0])   # left, middle, right

# --------------------------------------------------------------------------
# 3. Icon: "Splash badge" — white D on a blue disc, the logo's splash off the rim
# --------------------------------------------------------------------------
def mat(bb, cx, cy, size):
    bx0, by0, bx1, by1 = bb
    s = size / max(bx1 - bx0, by1 - by0)
    return s, f"matrix({s:.5f} 0 0 {s:.5f} {cx - s * (bx0 + bx1) / 2:.2f} {cy - s * (by0 + by1) / 2:.2f})"

def p(d, fill, bb, cx, cy, size, weight=0.0):
    s, m = mat(bb, cx, cy, size)
    st = f' stroke="{fill}" stroke-width="{weight / s:.2f}" stroke-linejoin="round"' if weight else ""
    return f'<path d="{d}" fill="{fill}"{st} transform="{m}"/>'

def badge(small=False, disc=True):
    cx, cy = 238, 276
    b = f'<circle cx="{cx}" cy="{cy}" r="222" fill="{BLUE}"/>' if disc else ""
    b += p(D, WHITE if disc else BLUE, bbox_of(D), cx - 4, cy + 4, 300, 10 if small else 0)
    if small:   # favicon sizes: one drop, heavier, so it survives 16 px
        mid = drops[1]
        x0_, y0_, x1_, y1_ = bbox_of(mid)
        b += f'<g transform="rotate(38 452 70)">{p(mid, SPLASH, bbox_of(mid), 452, 70, 120 * max(x1_ - x0_, y1_ - y0_) / (y1_ - y0_), 10)}</g>'
    else:
        b += f'<g transform="rotate(34 430 74)">{p(SPL, SPLASH, bbox_of(SPL), 430, 74, 178)}</g>'
    return b

def svg(body, title="Drishya"):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="{title}">'
            f"<title>{title}</title>{body}</svg>\n")

ICON = svg(badge())
ICON_SMALL = svg(badge(small=True))
for name, body in [("drishya-icon.svg", ICON), ("drishya-icon-small.svg", ICON_SMALL)]:
    open(os.path.join(PUB, name), "w", encoding="utf-8").write(body)
open(os.path.join(APP, "icon.svg"), "w", encoding="utf-8").write(ICON_SMALL)   # browser-tab icon

# --------------------------------------------------------------------------
# 4. Rasterise with headless Chrome (exact SVG rendering, transparent bg)
# --------------------------------------------------------------------------
BROWSERS = [r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
            "/usr/bin/google-chrome", "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"]
CHROME = next(b for b in BROWSERS if os.path.exists(b))
TMP = tempfile.mkdtemp()

def raster(svg_text, size, bg=None, scale=1.0):
    """Render svg_text to a size x size RGBA image, optionally on a solid bg, icon scaled inside."""
    sp = os.path.join(TMP, "i.svg")
    open(sp, "w", encoding="utf-8").write(svg_text)
    inner = round(size * scale)
    off = (size - inner) // 2
    html = os.path.join(TMP, "i.html")
    open(html, "w").write(f'<html><body style="margin:0;background:transparent">'
                          f'<img src="i.svg" width="{inner}" height="{inner}" style="position:absolute;left:{off}px;top:{off}px"></body></html>')
    out = os.path.join(TMP, "o.png")
    view = max(size, 256)
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
                    "--default-background-color=00000000", f"--window-size={view},{view}",
                    f"--screenshot={out}", "file:///" + html.replace("\\", "/")],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    img = Image.open(out).convert("RGBA").crop((0, 0, size, size))
    if bg:
        base = Image.new("RGBA", img.size, bg + (255,))
        base.alpha_composite(img)
        img = base
    return img

for n in (192, 512):
    raster(ICON, n).save(os.path.join(PUB, f"drishya-icon-{n}.png"), optimize=True)
raster(ICON, 512, bg=SITE_BG, scale=0.66).save(os.path.join(PUB, "drishya-icon-maskable-512.png"), optimize=True)
raster(ICON, 180, bg=SITE_BG, scale=0.84).convert("RGB").save(os.path.join(APP, "apple-icon.png"), optimize=True)
smalls = [raster(ICON_SMALL, n) for n in (16, 32, 48)]
smalls[1].save(os.path.join(PUB, "drishya-icon-32.png"), optimize=True)
smalls[2].save(os.path.join(APP, "favicon.ico"), format="ICO", sizes=[(48, 48), (32, 32), (16, 16)],
               append_images=[smalls[1], smalls[0]])

# --------------------------------------------------------------------------
# 5. Open Graph image: the full-colour logo on white, 1200x630
# --------------------------------------------------------------------------
og = Image.new("RGB", (1200, 630), (255, 255, 255))
logo = Image.open(os.path.join(PUB, "drishya-logo-transparent.png"))
lw = 620
logo = logo.resize((lw, round(lw * logo.height / logo.width)), Image.LANCZOS)
og.paste(logo, ((1200 - lw) // 2, 150), logo)
font = ImageFont.truetype(r"C:\Windows\Fonts\segoeui.ttf" if os.name == "nt" else "DejaVuSans.ttf", 34)
text = "Rapid on-site food screening  ·  research & design stage"
tw = ImageDraw.Draw(og).textlength(text, font=font)
ImageDraw.Draw(og).text(((1200 - tw) / 2, 470), text, fill=(75, 85, 99), font=font)
og.save(os.path.join(APP, "opengraph-image.png"), optimize=True)

shutil.rmtree(TMP, ignore_errors=True)
print("done:", sorted(os.listdir(PUB)))
