# Drishya brand kit

`source/drishya-logo-original.png` is the approved logo and the source of truth.
`source/drishya-logo-transparent-original.png` is the team's own 500 px transparent export, kept for reference.

Everything else is generated. Run this after changing the source or the icon:

```bash
pip install pillow numpy potracer
python brand/build_brand.py
```

## Files

| File | Use |
| --- | --- |
| `public/brand/drishya-logo-dark.png` | Wordmark on dark backgrounds (the whole site). Only the black/grey ink is lightened; both blues are unchanged |
| `public/brand/drishya-logo-transparent.png` | Wordmark on light backgrounds, original colours |
| `public/brand/drishya-logo.png` | Original logo on white (documents, slides) |
| `public/brand/drishya-icon.svg` | Master icon, "splash badge", 48 px and up |
| `public/brand/drishya-icon-small.svg` | Optical-size icon for 32 px and below (heavier D, single drop) |
| `public/brand/drishya-icon-{32,192,512}.png`, `-maskable-512.png` | PNG sizes for the PWA manifest |
| `src/app/favicon.ico` (16/32/48), `icon.svg`, `apple-icon.png` | Browser and home-screen icons, picked up by Next.js file conventions |
| `src/app/opengraph-image.png` | 1200×630 social preview |

## Rules

- Never redraw, recolour, stretch or re-letter the wordmark. Keep its aspect ratio (≈ 2.24 : 1).
- Use the wordmark wherever it fits; it stays readable down to about 40 px tall. Use the icon only where it can't fit.
- The icon is the logo's own D and splash drops (traced, not redrawn): white D on a #5170FF disc, #1B75BC splash off the top-right rim. It is always round, never on a square tile.
- Colours: D blue #5170FF, splash blue #1B75BC. The site's UI accents (teal `--nano`) stay as they are; the brand blue is for brand marks.
