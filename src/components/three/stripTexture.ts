import * as THREE from "three";
import type { TargetId } from "@/content/research";

/**
 * Draws the proposed 2 cm × 6 cm paper-microfluidic strip onto a canvas:
 * wax barrier, hydrophilic channels, 4 reagent zones, a negative-control
 * zone and a reference color patch. Wet front and zone colors are driven by
 * the caller (simulation only).
 */

export type ZoneId = TargetId | "control";

export const STRIP_ZONES: { id: ZoneId; label: string; name: string; u: number; v: number; base: string }[] = [
  { id: "urea", label: "U", name: "Urea", u: 0.27, v: 0.47, base: "#f3efd9" },
  { id: "detergent", label: "D", name: "Detergent", u: 0.73, v: 0.47, base: "#dfe3a8" },
  { id: "starch", label: "S", name: "Starch", u: 0.27, v: 0.27, base: "#efe0b8" },
  { id: "h2o2", label: "P", name: "H₂O₂", u: 0.73, v: 0.27, base: "#f4efe6" },
  { id: "control", label: "C", name: "Negative control", u: 0.5, v: 0.1, base: "#f1efe8" },
];

const INLET = { u: 0.5, v: 0.87 };
const BRANCH_V = [0.47, 0.27];
const CONTROL_V = 0.1;
const BRANCH_LEN = 0.23;
const SOAK = 0.08;

export interface StripState {
  /** 0..1 progress of the capillary wet front through the whole network */
  flow: number;
  /** tint of the wetted paper (sample color) */
  sampleTint: string;
  /** per-zone color after reaction (already mixed by caller) */
  zoneColor: Partial<Record<ZoneId, string>>;
  /** which zone is highlighted (ring) */
  focus?: ZoneId | null;
  /** has the inlet received a drop yet */
  dropped: boolean;
  /**
   * "milk": the proposed 4-zone milk strip. "pb": a single dithizone zone for
   * the turmeric extract (conceptual — the research does not specify a
   * turmeric cartridge layout).
   */
  layout?: "milk" | "pb";
}

export const W = 256;
export const H = 768;

let fiber: HTMLCanvasElement | null = null;
function fiberPattern() {
  if (fiber) return fiber;
  fiber = document.createElement("canvas");
  fiber.width = W;
  fiber.height = H;
  const c = fiber.getContext("2d")!;
  c.fillStyle = "#fff";
  c.fillRect(0, 0, W, H);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 2600; i++) {
    const x = rnd() * W;
    const y = rnd() * H;
    const a = rnd() * Math.PI;
    const l = 3 + rnd() * 9;
    c.strokeStyle = `rgba(120,110,90,${0.05 + rnd() * 0.08})`;
    c.lineWidth = 0.6;
    c.beginPath();
    c.moveTo(x, y);
    c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l);
    c.stroke();
  }
  return fiber;
}

const P = (u: number, v: number): [number, number] => [u * W, v * H];

/** Flow timeline. The trunk fills first; branches start as the front passes them. */
function flowFractions(flow: number) {
  const trunkLen = INLET.v - CONTROL_V;
  const total = trunkLen + SOAK;
  const d = flow * total;
  const trunk = Math.min(1, d / trunkLen);
  const branches = BRANCH_V.map((bv) => Math.max(0, Math.min(1, (d - (INLET.v - bv)) / BRANCH_LEN)));
  const soakAt = (start: number) => Math.max(0, Math.min(1, (d - start) / SOAK));
  const soak: Record<ZoneId, number> = {
    urea: soakAt(INLET.v - BRANCH_V[0] + BRANCH_LEN * 0.8),
    detergent: soakAt(INLET.v - BRANCH_V[0] + BRANCH_LEN * 0.8),
    starch: soakAt(INLET.v - BRANCH_V[1] + BRANCH_LEN * 0.8),
    h2o2: soakAt(INLET.v - BRANCH_V[1] + BRANCH_LEN * 0.8),
    leadchromate: soakAt(trunkLen - 0.02),
    control: soakAt(trunkLen - 0.02),
  };
  return { trunk, branches, soak };
}

/** 0..1 how wet a given zone is at a given flow value. */
export function zoneSoak(flow: number, id: ZoneId) {
  return flowFractions(flow).soak[id];
}

const PB_ZONES = [{ id: "leadchromate" as ZoneId, label: "Pb", name: "Lead (dithizone)", u: 0.5, v: 0.1, base: "#5d7d5f" }];

export function drawStrip(ctx: CanvasRenderingContext2D, s: StripState) {
  const pb = s.layout === "pb";
  const ZONES = pb ? PB_ZONES : STRIP_ZONES;
  const BR = pb ? [] : BRANCH_V;
  const { trunk, branches, soak } = flowFractions(s.flow);
  ctx.clearRect(0, 0, W, H);

  // wax-printed hydrophobic barrier
  ctx.fillStyle = "#26303c";
  ctx.fillRect(0, 0, W, H);

  // hydrophilic (unwaxed) paper channels
  const paper = "#f4f2eb";
  ctx.strokeStyle = paper;
  ctx.lineWidth = 22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(...P(INLET.u, INLET.v));
  ctx.lineTo(...P(0.5, CONTROL_V));
  ctx.stroke();
  for (const bv of BR) {
    ctx.beginPath();
    ctx.moveTo(...P(0.27, bv));
    ctx.lineTo(...P(0.73, bv));
    ctx.stroke();
  }
  ctx.fillStyle = paper;
  ctx.beginPath();
  ctx.arc(...P(INLET.u, INLET.v), 36, 0, Math.PI * 2);
  ctx.fill();
  for (const z of ZONES) {
    ctx.beginPath();
    ctx.arc(...P(z.u, z.v), 34, 0, Math.PI * 2);
    ctx.fill();
  }

  // reference color patch (grey scale + primaries) along the bottom edge
  const refs = ["#ffffff", "#bdbdbd", "#6e6e6e", "#1d1d1d", "#d8403a", "#3ba55b", "#3a6fd8"];
  refs.forEach((c, i) => {
    ctx.fillStyle = c;
    ctx.fillRect(18 + i * 31.5, H - 34, 28, 20);
  });

  // paper fibres
  ctx.globalCompositeOperation = "multiply";
  ctx.drawImage(fiberPattern(), 0, 0);
  ctx.globalCompositeOperation = "source-over";

  // dried reagent zones
  for (const z of ZONES) {
    ctx.fillStyle = z.base;
    ctx.beginPath();
    ctx.arc(...P(z.u, z.v), 30, 0, Math.PI * 2);
    ctx.fill();
  }

  // capillary wet front
  const wet = s.sampleTint;
  ctx.globalAlpha = 0.85;
  if (s.dropped) {
    ctx.fillStyle = wet;
    ctx.beginPath();
    ctx.arc(...P(INLET.u, INLET.v), 30, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = wet;
  ctx.lineWidth = 16;
  if (trunk > 0) {
    const vEnd = INLET.v - (INLET.v - CONTROL_V) * trunk;
    ctx.beginPath();
    ctx.moveTo(...P(0.5, INLET.v));
    ctx.lineTo(...P(0.5, vEnd));
    ctx.stroke();
  }
  BR.forEach((bv, i) => {
    const b = branches[i];
    if (b <= 0) return;
    ctx.beginPath();
    ctx.moveTo(...P(0.5 - BRANCH_LEN * b, bv));
    ctx.lineTo(...P(0.5 + BRANCH_LEN * b, bv));
    ctx.stroke();
  });
  ctx.globalAlpha = 1;

  // zones: soak + reaction color
  for (const z of ZONES) {
    const k = soak[z.id];
    if (k <= 0) continue;
    ctx.globalAlpha = 0.3 + 0.7 * k;
    ctx.fillStyle = s.zoneColor[z.id] ?? wet;
    ctx.beginPath();
    ctx.arc(...P(z.u, z.v), 30 * (0.4 + 0.6 * k), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  if (s.focus) {
    const z = ZONES.find((q) => q.id === s.focus);
    if (z) {
      ctx.strokeStyle = "#4fe3c1";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(...P(z.u, z.v), 41, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // printed labels on the wax
  ctx.fillStyle = "rgba(230,240,245,0.85)";
  ctx.font = "600 22px ui-monospace, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const z of ZONES) {
    const [x, y] = P(z.u, z.v);
    if (z.u === 0.5) ctx.fillText(z.label, x + 58, y);
    else ctx.fillText(z.label, z.u < 0.5 ? x - 50 : x + 50, y - 44);
  }
  ctx.font = "500 14px ui-monospace, monospace";
  ctx.fillText("SAMPLE", W / 2, INLET.v * H + 52);
}

/** Creates a canvas + texture pair and returns an updater. */
export function createStripTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return {
    canvas,
    texture,
    draw(s: StripState) {
      drawStrip(ctx, s);
      texture.needsUpdate = true;
    },
  };
}

/** Wet paper tint by food. */
export const SAMPLE_TINT: Record<string, string> = {
  milk: "#dcd6c4",
  turmeric: "#e2b84a",
};
