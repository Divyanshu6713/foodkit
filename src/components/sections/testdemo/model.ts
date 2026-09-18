import type { Method, Target } from "@/content/research";
import { mixHex, saturating } from "@/lib/color";

/** Phases of the simulated test. Auto phases advance on a timer. */
export type Phase =
  | "food"
  | "target"
  | "insert-ready"
  | "inserting"
  | "run-ready"
  | "scanning"
  | "nano"
  | "zoom-out"
  | "analyzing"
  | "result";

export const AUTO_DURATION: Partial<Record<Phase, number>> = {
  inserting: 5.6,
  scanning: 2.4,
  nano: 8.5,
  "zoom-out": 1.6,
  analyzing: 3.2,
};

export const NEXT: Partial<Record<Phase, Phase>> = {
  inserting: "run-ready",
  scanning: "nano",
  nano: "zoom-out",
  "zoom-out": "analyzing",
  analyzing: "result",
};

/** Step number (1–6) shown in the UI for each phase. */
export const STEP_OF: Record<Phase, number> = {
  food: 1,
  target: 2,
  "insert-ready": 3,
  inserting: 3,
  "run-ready": 4,
  scanning: 4,
  nano: 4,
  "zoom-out": 5,
  analyzing: 5,
  result: 6,
};

export const STEPS = ["Select food", "Select adulterant", "Insert sample", "Run detection", "Analyze signal", "Result"];

export type Scenario = "clean" | "adulterated";

export interface SimResult {
  value: number;
  /** 0..1 normalised response used for color / signal */
  response: number;
  zoneColor: string;
  verdict: "pass" | "fail";
  headline: string;
  detail: string;
}

/**
 * SIMULATED result. The value is a scenario preset from content/research.ts
 * (a clean or adulterated example chosen inside/outside the literature range)
 * plus ±3 % jitter — it is not computed from any measurement.
 */
export function simulate(target: Target, method: Method, scenario: Scenario, seed: number): SimResult {
  const base = scenario === "clean" ? target.cleanValue : target.adulteratedValue;
  const jitter = 1 + (((seed * 9301 + 49297) % 233280) / 233280 - 0.5) * 0.06;
  const value = Math.max(0, +(base * jitter).toFixed(target.unit === "ppm" ? 0 : 2));
  const response = saturating(value, target.rangeMax);
  const zoneColor = mixHex(method.colorFrom, method.colorTo, response);
  const th = target.threshold;
  if (th.kind === "limit") {
    const fail = value > th.value;
    return {
      value,
      response,
      zoneColor,
      verdict: fail ? "fail" : "pass",
      headline: fail ? "Above reference limit" : "Within reference limit",
      detail: `${th.label}. Normal milk contains 3–6 mM urea naturally, so a reading is only flagged above the limit.`,
    };
  }
  const detected = value >= th.value;
  return {
    value,
    response,
    zoneColor,
    verdict: detected ? "fail" : "pass",
    headline: detected ? `${target.name} detected — screening positive` : `${target.name} not detected`,
    detail: detected
      ? `Response above the lower bound of the stated range (${target.range}). A screening positive should be confirmed by an accredited lab.`
      : `No response above the lower bound of the stated range (${target.range}).`,
  };
}

export function formatValue(v: number, unit: string) {
  if (v === 0) return `0 ${unit}`;
  return `${v} ${unit}`;
}
