import type { Evidence } from "@/content/research";
import { band, smooth } from "@/lib/color";

export interface Stop {
  key: string;
  scale: string;
  title: string;
  text: string;
  evidence: Evidence;
  depth: number;
  from: number;
  to: number;
}

const RAW: Omit<Stop, "from" | "to">[] = [
  { key: "food", scale: "~5 mm · macro", title: "Food sample", text: "A 50–100 µL drop of milk is all the proposed cartridge needs.", evidence: "proposed", depth: 0 },
  { key: "micro", scale: "~10 µm · micro", title: "Microstructure", text: "Milk is an emulsion of fat globules and protein micelles in water. These proteins cause the 'matrix interference' and electrode fouling the research warns about.", evidence: "concept", depth: 1 },
  { key: "mol", scale: "~1 nm · molecular", title: "Molecules", text: "Most of the sample is water and dissolved molecules. Urea is present naturally too: 3–6 mM in normal milk.", evidence: "lit", depth: 2 },
  { key: "analyte", scale: "~0.5 nm", title: "Target analyte", text: "Urea, CO(NH₂)₂. Adulteration pushes it past the FSSAI-permitted limit of 70 mg/dL (11.6 mM).", evidence: "lit", depth: 2.15 },
  { key: "sensor", scale: "~10–50 nm · nano", title: "Nano-engineered sensor", text: "Citrate-capped silver nanoparticles, dried into the paper zone. Surface plasmon resonance makes them absorb strongly in the visible (UV-Vis peak ~420 nm), so they look yellow.", evidence: "lit", depth: 4 },
  { key: "event", scale: "nano", title: "Detection event", text: "The analyte triggers aggregation. That shifts the plasmon absorption, and the zone's color moves from yellow toward blue.", evidence: "concept", depth: 4 },
  { key: "signal", scale: "back out · optical", title: "Signal", text: "Light from the LED passing through the zone changes. A photodiode, or the phone's camera, records the difference.", evidence: "proposed", depth: 4 },
  { key: "data", scale: "electronics", title: "Data", text: "ADC counts or RGB values reach the ESP32 or the phone, and a calibration curve maps them to a concentration.", evidence: "proposed", depth: 4 },
  { key: "result", scale: "you", title: "Result", text: "Pass / fail against the reference limit plus a numeric value, which can be logged to Google Sheets or ThingSpeak.", evidence: "proposed", depth: 4 },
];

const W = [1, 1, 1, 0.9, 1.1, 1.3, 1, 1, 1.1];
const TOTAL = W.reduce((a, b) => a + b, 0);

export const JOURNEY_STOPS: Stop[] = (() => {
  let acc = 0;
  return RAW.map((r, i) => {
    const from = acc / TOTAL;
    acc += W[i];
    return { ...r, from, to: acc / TOTAL };
  });
})();

export function stopIndex(p: number) {
  const i = JOURNEY_STOPS.findIndex((s) => p >= s.from && p < s.to);
  return i === -1 ? JOURNEY_STOPS.length - 1 : i;
}

/** Zoom depth for a scroll progress value (continuous across stops). */
export function depthAt(p: number) {
  const i = stopIndex(p);
  const s = JOURNEY_STOPS[i];
  const prev = i > 0 ? JOURNEY_STOPS[i - 1].depth : s.depth;
  const u = (p - s.from) / (s.to - s.from);
  return prev + (s.depth - prev) * smooth(band(u, 0, 0.5));
}

/** 0..1 how much a depth transition is in flight (drives the DOF blur). */
export function transitionAt(p: number) {
  const i = stopIndex(p);
  const s = JOURNEY_STOPS[i];
  const prev = i > 0 ? JOURNEY_STOPS[i - 1].depth : s.depth;
  if (Math.abs(prev - s.depth) < 0.5) return 0;
  const u = band((p - s.from) / (s.to - s.from), 0, 0.5);
  return Math.sin(u * Math.PI);
}
