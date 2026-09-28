"use client";
import { ASSAY, DEMO, type Channel } from "@/content/nanosense";
import { hexToRgb, mix } from "./model";

/**
 * Image handling for the Photograph Analysis step. Everything here is real
 * computation on the pixels of the photo; nothing is simulated except the
 * synthetic photos that SIMULATION mode generates (makeSyntheticPhoto).
 */

export interface Roi {
  /** Normalized to the image size, 0…1. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Extraction {
  rgb: [number, number, number];
  sd: [number, number, number];
  /** Pixels used after exclusions. */
  n: number;
  /** Pixels excluded as glare/saturation or deep shadow. */
  excluded: number;
}

const MAX_SIDE = 960;

/** Reads an image file (or camera blob) into a downscaled JPEG data URL. */
export async function fileToDataUrl(file: Blob): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    return drawScaled(img, img.naturalWidth, img.naturalHeight);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function videoFrameToDataUrl(video: HTMLVideoElement) {
  return drawScaled(video, video.videoWidth, video.videoHeight);
}

function drawScaled(src: CanvasImageSource, w: number, h: number) {
  const s = Math.min(1, MAX_SIDE / Math.max(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * s);
  c.height = Math.round(h * s);
  c.getContext("2d")!.drawImage(src, 0, 0, c.width, c.height);
  return c.toDataURL("image/jpeg", 0.92);
}

export function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = () => rej(new Error("Could not read this image."));
    img.src = src;
  });
}

export async function imageData(src: string) {
  const img = await loadImage(src);
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  return ctx.getImageData(0, 0, c.width, c.height);
}

/**
 * Representative colour of a region: pixels outside the ROI are ignored,
 * saturated glare (any channel ≥ 250) and deep shadow (all channels ≤ 8) are
 * excluded, then the brightest and darkest 10 % (by luminance) are trimmed.
 */
export function extract(data: ImageData, roi: Roi): Extraction | null {
  const x0 = Math.max(0, Math.floor(roi.x * data.width));
  const y0 = Math.max(0, Math.floor(roi.y * data.height));
  const x1 = Math.min(data.width, Math.ceil((roi.x + roi.w) * data.width));
  const y1 = Math.min(data.height, Math.ceil((roi.y + roi.h) * data.height));
  const px: [number, number, number, number][] = [];
  let excluded = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * data.width + x) * 4;
      const r = data.data[i];
      const g = data.data[i + 1];
      const b = data.data[i + 2];
      if (r >= 250 || g >= 250 || b >= 250 || (r <= 8 && g <= 8 && b <= 8)) {
        excluded++;
        continue;
      }
      px.push([r, g, b, 0.2126 * r + 0.7152 * g + 0.0722 * b]);
    }
  }
  if (px.length < 12) return null;
  px.sort((a, b) => a[3] - b[3]);
  const cut = Math.floor(px.length * 0.1);
  const kept = px.slice(cut, px.length - cut);
  excluded += px.length - kept.length;
  const mean = [0, 1, 2].map((k) => kept.reduce((s, p) => s + p[k], 0) / kept.length) as [number, number, number];
  const sd = [0, 1, 2].map((k) => Math.sqrt(kept.reduce((s, p) => s + (p[k] - mean[k]) ** 2, 0) / kept.length)) as [number, number, number];
  return { rgb: mean, sd, n: kept.length, excluded };
}

const CH: Record<Channel, 0 | 1 | 2> = { R: 0, G: 1, B: 2 };

/** Normalized optical feature F = −log10(C_roi / C_ref). */
export function opticalFeature(sample: Extraction | null, white: Extraction | null, channel: Channel) {
  if (!sample) return null;
  const k = CH[channel];
  const ref = white ? white.rgb[k] : 255;
  return -Math.log10(Math.max(1, sample.rgb[k]) / Math.max(1, ref));
}

export function rgbHex(rgb: [number, number, number]) {
  return "#" + rgb.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");
}

/* ------------------------------------------------------------------ */
/* Synthetic photos (SIMULATION mode only)                             */
/* ------------------------------------------------------------------ */

/** Illustrative colour for a concentration c, consistent with F = f0 + k·c. */
export function demoColour(c: number) {
  const t = Math.min(1, c / DEMO.conc.reference);
  const [r, g] = hexToRgb(mix(ASSAY.colours.control, ASSAY.colours.positive, t));
  const b = DEMO.white * 10 ** -(DEMO.f0 + DEMO.k * c);
  return [r, g, b] as [number, number, number];
}

function prng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/**
 * Draws a test tube on a white card under uneven light, with glare and
 * sensor noise, and returns it with the matching ROIs. Clearly synthetic.
 */
export function makeSyntheticPhoto(c: number, seed: number) {
  const W = 640;
  const H = 480;
  const cv = document.createElement("canvas");
  cv.width = W;
  cv.height = H;
  const ctx = cv.getContext("2d", { willReadFrequently: true })!;
  const [r, g, b] = demoColour(c);
  const white = DEMO.white;

  // card
  ctx.fillStyle = `rgb(${white},${white},${white})`;
  ctx.fillRect(0, 0, W, H);
  // tube glass + liquid
  const tx = W * 0.42;
  const tw = W * 0.16;
  const top = H * 0.08;
  const liq = H * 0.34;
  const bottom = H * 0.86;
  ctx.fillStyle = "rgb(228,232,236)";
  ctx.beginPath();
  ctx.roundRect(tx - 6, top, tw + 12, bottom - top + 6, [6, 6, tw / 2 + 6, tw / 2 + 6]);
  ctx.fill();
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.beginPath();
  ctx.roundRect(tx, liq, tw, bottom - liq, [0, 0, tw / 2, tw / 2]);
  ctx.fill();
  // glare stripe (saturated, so the glare filter removes it)
  ctx.fillStyle = "rgb(255,255,255)";
  ctx.fillRect(tx + tw * 0.14, liq + 12, tw * 0.07, bottom - liq - 60);
  // label
  ctx.fillStyle = "rgba(60,70,80,0.75)";
  ctx.font = "600 15px monospace";
  ctx.fillText("SYNTHETIC IMAGE · SIMULATION", 18, H - 18);

  // uneven lighting + noise, applied to every pixel
  const img = ctx.getImageData(0, 0, W, H);
  const rnd = prng(seed);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const light = 0.86 + 0.14 * (1 - Math.hypot(x / W - 0.35, y / H - 0.3));
      for (let k = 0; k < 3; k++) {
        const v = img.data[i + k];
        img.data[i + k] = v >= 250 ? v : Math.max(0, Math.min(249, v * light + (rnd() - 0.5) * 6));
      }
    }
  }
  ctx.putImageData(img, 0, 0);

  const roi: Roi = { x: (tx + tw * 0.3) / W, y: (liq + H * 0.12) / H, w: (tw * 0.55) / W, h: (bottom - liq - H * 0.2) / H };
  const whiteRoi: Roi = { x: (tx + tw + W * 0.05) / W, y: roi.y, w: 0.1, h: roi.h * 0.6 };
  const data = ctx.getImageData(0, 0, W, H);
  return {
    photo: cv.toDataURL("image/jpeg", 0.92),
    roi,
    whiteRoi,
    sampleRgb: extract(data, roi),
    whiteRgb: extract(data, whiteRoi),
  };
}
