import { TARGETS, type TargetId } from "@/content/research";
import { hexToRgb, mixHex, saturating } from "./color";

/**
 * ILLUSTRATIVE color-response model used by the colorimetry and phone
 * simulations. Start/end colors follow the chemistry named in the research
 * (e.g. AgNP yellow → blue, iodine → blue-black); the curve shape is a
 * generic saturating response, NOT fitted to any measured data.
 */

export interface Chem {
  target: TargetId;
  name: string;
  reagent: string;
  unit: string;
  max: number; // slider max
  rangeMin: number;
  rangeMax: number;
  from: string;
  to: string;
  threshold: number;
  thresholdLabel: string;
  thresholdKind: "limit" | "lower-bound";
}

export const CHEMS: Chem[] = TARGETS.filter((t) => t.methods[0].kind === "colorimetric").map((t) => {
  const m = t.methods[0];
  return {
    target: t.id,
    name: t.name,
    reagent: m.name,
    unit: t.unit,
    max: +(t.rangeMax * 1.2).toFixed(2),
    rangeMin: t.rangeMin,
    rangeMax: t.rangeMax,
    from: m.colorFrom,
    to: m.colorTo,
    threshold: t.threshold.value,
    thresholdLabel: t.threshold.kind === "limit" ? "FSSAI limit" : "Range lower bound",
    thresholdKind: t.threshold.kind,
  };
});

export function colorAt(chem: Chem, c: number) {
  return mixHex(chem.from, chem.to, saturating(c, chem.rangeMax));
}

export function rgbAt(chem: Chem, c: number) {
  return hexToRgb(colorAt(chem, c));
}

/** Inverse of the model: least-squares match of an observed RGB to the curve. */
export function estimate(chem: Chem, rgb: [number, number, number]) {
  let best = 0;
  let err = Infinity;
  const steps = 400;
  for (let i = 0; i <= steps; i++) {
    const c = (i / steps) * chem.max;
    const r = rgbAt(chem, c);
    const e = (r[0] - rgb[0]) ** 2 + (r[1] - rgb[1]) ** 2 + (r[2] - rgb[2]) ** 2;
    if (e < err) {
      err = e;
      best = c;
    }
  }
  return best;
}

export function fmt(v: number, unit: string) {
  const d = v < 1 ? 2 : v < 10 ? 1 : 0;
  return `${v.toFixed(d)} ${unit}`;
}
