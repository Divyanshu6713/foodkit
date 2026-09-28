import { ASSAY, CAL_RULES, SIM } from "@/content/nanosense";

/**
 * Two kinds of maths live here:
 *
 * 1. FUTURE-HARDWARE SIMULATION (reading, simulateTrace): illustrative
 *    absorbance → photodiode voltage → ESP32 ADC counts → processed value.
 *    Not linked to any photo or physical test.
 * 2. CALIBRATION (analyseCalibration, estimate): ordinary least squares on
 *    whatever dataset the user provides. A concentration is only ever
 *    computed through a fitted calibration model.
 */

type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: RGB) {
  return "#" + [r, g, b].map((v) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0")).join("");
}

export function mix(a: string, b: string, t: number) {
  const x = hexToRgb(a);
  const y = hexToRgb(b);
  return rgbToHex([0, 1, 2].map((i) => x[i] + (y[i] - x[i]) * t) as RGB);
}

export interface Reading {
  au: number;
  transmittance: number;
  volts: number;
  counts: number;
}

export function reading(au: number): Reading {
  const transmittance = 10 ** -au;
  const volts = SIM.darkVolts + (SIM.blankVolts - SIM.darkVolts) * transmittance;
  const counts = Math.round((volts / ASSAY.adcRefVolts) * (2 ** ASSAY.adcBits - 1));
  return { au, transmittance, volts, counts };
}

/* ------------------------------------------------------------------ */
/* Raw signal trace                                                    */
/* ------------------------------------------------------------------ */

function seed(str: string) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

function rng(s: number) {
  let a = s;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(r: () => number) {
  return Math.sqrt(-2 * Math.log(r() || 1e-9)) * Math.cos(2 * Math.PI * r());
}

export const TRACE = { seconds: 20, n: 240, darkEnd: 4, blankEnd: 8, settle: 1.2 };

export interface Trace {
  t: number[];
  raw: number[];
  filtered: number[];
  corrected: number[];
  absorbance: (number | null)[];
  stats: {
    rawMean: number;
    processed: number;
    snr: number;
    cv: number;
    dark: number;
    blank: number;
  };
}

function movingAverage(y: number[], w: number) {
  const h = Math.floor(w / 2);
  return y.map((_, i) => {
    let s = 0;
    let n = 0;
    for (let j = Math.max(0, i - h); j <= Math.min(y.length - 1, i + h); j++) {
      s += y[j];
      n++;
    }
    return s / n;
  });
}

const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
const sd = (a: number[]) => {
  const m = mean(a);
  return Math.sqrt(mean(a.map((v) => (v - m) ** 2)));
};

/**
 * Simulated photodiode trace: dark (LED off) → blank (LED on, no colour) →
 * sample. Then the three processing stages the dashboard animates.
 */
export function simulateTrace(au: number, id: string): Trace {
  const r = rng(seed(id + au.toFixed(3)));
  const { seconds, n, darkEnd, blankEnd, settle } = TRACE;
  const target = reading(au).volts;
  const t: number[] = [];
  const raw: number[] = [];
  for (let i = 0; i < n; i++) {
    const ti = (i / (n - 1)) * seconds;
    let v: number;
    if (ti < darkEnd) v = SIM.darkVolts;
    else if (ti < blankEnd) v = SIM.blankVolts;
    else v = target + (SIM.blankVolts - target) * Math.exp(-(ti - blankEnd) / (settle / 3));
    v += gauss(r) * SIM.noiseVolts;
    if (r() < 0.02) v += (r() - 0.5) * 0.25; // occasional spike
    t.push(ti);
    raw.push(v);
  }
  // Filter within each region so the steps stay sharp.
  const regions = [0, darkEnd, blankEnd, seconds + 1];
  const filtered = raw.slice();
  for (let k = 0; k < 3; k++) {
    const idx = t.map((ti, i) => (ti >= regions[k] && ti < regions[k + 1] ? i : -1)).filter((i) => i >= 0);
    const f = movingAverage(idx.map((i) => raw[i]), 11);
    idx.forEach((i, j) => (filtered[i] = f[j]));
  }
  const inRange = (a: number, b: number) => t.map((ti, i) => (ti >= a && ti < b ? i : -1)).filter((i) => i >= 0);
  const darkIdx = inRange(0.4, darkEnd - 0.4);
  const blankIdx = inRange(darkEnd + 0.4, blankEnd - 0.4);
  const plateauIdx = inRange(blankEnd + settle + 0.5, seconds);
  const dark = mean(darkIdx.map((i) => filtered[i]));
  const corrected = filtered.map((v) => v - dark);
  const blank = mean(blankIdx.map((i) => corrected[i]));
  const absorbance = t.map((ti, i) => (ti >= blankEnd ? -Math.log10(Math.max(1e-4, corrected[i] / blank)) : null));
  const plateauAbs = plateauIdx.map((i) => absorbance[i] as number);
  const rawPlateau = plateauIdx.map((i) => raw[i]);
  const processed = mean(plateauAbs);
  return {
    t,
    raw,
    filtered,
    corrected,
    absorbance,
    stats: {
      rawMean: mean(rawPlateau),
      processed,
      snr: (mean(rawPlateau) - dark) / sd(rawPlateau),
      cv: (sd(plateauAbs) / Math.max(1e-6, processed)) * 100,
      dark,
      blank,
    },
  };
}

/* ------------------------------------------------------------------ */
/* Calibration                                                         */
/* ------------------------------------------------------------------ */

export type RowOrigin = "manual" | "csv" | "photo" | "illustrative";

/** One calibration row exactly as entered (strings, so nothing is coerced or invented). */
export interface CalRow {
  sampleId: string;
  conc: string;
  feature: string;
  replicate: string;
  notes: string;
  origin: RowOrigin;
}

export interface CalPoint {
  conc: number;
  signal: number;
  row: number;
  sampleId: string;
  replicate: string;
}

export interface Fit {
  ok: boolean;
  /** Why no model was fitted (when !ok). */
  reason: string;
  slope: number;
  intercept: number;
  r2: number;
  /** Residual standard deviation s_y/x. */
  syx: number;
  n: number;
  levels: number;
  minConc: number;
  maxConc: number;
  xbar: number;
  ybar: number;
  sxx: number;
}

export interface CalAnalysis {
  points: CalPoint[];
  invalid: { row: number; reason: string }[];
  levels: { conc: number; mean: number; sd: number; n: number }[];
  fit: Fit;
  /** Residual per valid point (same order as points). */
  residuals: number[];
}

const num = (v: string) => {
  const t = v.trim();
  if (t === "") return NaN;
  return Number(t);
};

export function analyseCalibration(rows: CalRow[]): CalAnalysis {
  const points: CalPoint[] = [];
  const invalid: CalAnalysis["invalid"] = [];
  rows.forEach((r, i) => {
    const c = num(r.conc);
    const f = num(r.feature);
    if (!Number.isFinite(c)) invalid.push({ row: i, reason: "known concentration missing or not a number" });
    else if (!Number.isFinite(f)) invalid.push({ row: i, reason: "optical feature missing or not a number" });
    else if (c < 0) invalid.push({ row: i, reason: "negative concentration" });
    else points.push({ conc: c, signal: f, row: i, sampleId: r.sampleId, replicate: r.replicate });
  });
  const byLevel = new Map<number, number[]>();
  points.forEach((p) => byLevel.set(p.conc, [...(byLevel.get(p.conc) ?? []), p.signal]));
  const levels = [...byLevel.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([conc, ys]) => {
      const mean = ys.reduce((s, v) => s + v, 0) / ys.length;
      const sd = ys.length > 1 ? Math.sqrt(ys.reduce((s, v) => s + (v - mean) ** 2, 0) / (ys.length - 1)) : 0;
      return { conc, mean, sd, n: ys.length };
    });
  const fit = linearFit(points, levels.length);
  const residuals = points.map((p) => (fit.ok ? p.signal - (fit.intercept + fit.slope * p.conc) : NaN));
  return { points, invalid, levels, fit, residuals };
}

function linearFit(p: CalPoint[], levels: number): Fit {
  const n = p.length;
  const minConc = n ? Math.min(...p.map((q) => q.conc)) : 0;
  const maxConc = n ? Math.max(...p.map((q) => q.conc)) : 0;
  const base = { slope: 0, intercept: 0, r2: 0, syx: 0, n, levels, minConc, maxConc, xbar: 0, ybar: 0, sxx: 0 };
  if (n === 0) return { ...base, ok: false, reason: "No calibration data." };
  if (levels < CAL_RULES.minLevels || n < CAL_RULES.minPoints)
    return { ...base, ok: false, reason: `At least ${CAL_RULES.minLevels} different concentration levels are needed to fit a model (currently ${levels}).` };
  const xbar = p.reduce((s, q) => s + q.conc, 0) / n;
  const ybar = p.reduce((s, q) => s + q.signal, 0) / n;
  const sxx = p.reduce((s, q) => s + (q.conc - xbar) ** 2, 0);
  const sxy = p.reduce((s, q) => s + (q.conc - xbar) * (q.signal - ybar), 0);
  const slope = sxy / sxx;
  const intercept = ybar - slope * xbar;
  const ssTot = p.reduce((s, q) => s + (q.signal - ybar) ** 2, 0);
  const ssRes = p.reduce((s, q) => s + (q.signal - (intercept + slope * q.conc)) ** 2, 0);
  const syx = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0;
  if (!Number.isFinite(slope) || Math.abs(slope) < 1e-12)
    return { ...base, xbar, ybar, sxx, ok: false, reason: "The optical feature does not change with concentration (slope ≈ 0), so it cannot be calibrated." };
  return { ok: true, reason: "", slope, intercept, r2: ssTot ? 1 - ssRes / ssTot : 0, syx, n, levels, minConc, maxConc, xbar, ybar, sxx };
}

export type EstimateStatus = "in-range" | "below" | "above";

export interface Estimate {
  value: number;
  /** ± one standard deviation of the inverse prediction (single measurement). */
  sd: number;
  status: EstimateStatus;
}

/** Inverse prediction x0 = (y0 − b) / m, with its standard deviation. */
export function estimate(fit: Fit, y0: number): Estimate | null {
  if (!fit.ok) return null;
  const value = (y0 - fit.intercept) / fit.slope;
  const sd = (fit.syx / Math.abs(fit.slope)) * Math.sqrt(1 + 1 / fit.n + (y0 - fit.ybar) ** 2 / (fit.slope ** 2 * fit.sxx));
  const status: EstimateStatus = value < fit.minConc - 1e-9 ? "below" : value > fit.maxConc + 1e-9 ? "above" : "in-range";
  return { value, sd, status };
}

export function formatEstimate(fit: Fit, e: Estimate | null, unit: string) {
  if (!e) return "—";
  if (e.status === "below") return `< ${fmtNum(fit.minConc)} ${unit}`;
  if (e.status === "above") return `> ${fmtNum(fit.maxConc)} ${unit}`;
  return `${e.value.toFixed(2)} ${unit}`;
}

export function fmtNum(v: number) {
  return Number.isInteger(v) ? String(v) : v.toPrecision(3);
}
