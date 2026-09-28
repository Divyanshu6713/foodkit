"use client";
import { useEffect, useRef } from "react";
import { hexToRgb } from "../model";
import { useReducedMotion } from "./useSize";

/**
 * CONCEPTUAL illustration of the nano-sensing layer.
 *
 * phase 0  nanoparticles stable in the sensing medium
 * phase 1  target analyte enters the sensing environment
 * phase 2  target-specific interaction (molecules bind at the surface)
 * phase 3  nano-sensing response: the optical response changes
 * phase 4  observable optical signal: a light beam is attenuated differently
 * phase 5  a camera / optical sensor records the signal
 *
 * It deliberately shows no specific mechanism (no aggregation, no spectrum
 * shift): the real mechanism depends on the validated assay.
 */
export function NanoCanvas({
  phase,
  baseColour,
  responseColour,
  mediumBefore,
  mediumAfter,
  analyteColour = "#e2692f",
  className = "",
  seed = 7,
}: {
  phase: number;
  baseColour: string;
  responseColour: string;
  mediumBefore: string;
  mediumAfter: string;
  analyteColour?: string;
  className?: string;
  seed?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const phaseRef = useRef(phase);
  const reduced = useReducedMotion();
  const times = useRef<number[] | null>(null);

  // Record when each phase was reached (phases present at mount count as already done).
  useEffect(() => {
    const now = performance.now();
    times.current = times.current
      ? times.current.map((t, p) => (p <= phase ? (t === Infinity ? now : t) : Infinity))
      : [0, 1, 2, 3, 4, 5].map((p) => (p <= phase ? -1e9 : Infinity));
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    let w = 0;
    let h = 0;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let s = seed;
    const rand = () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };

    type NP = { bx: number; by: number; x: number; y: number; ph: number };
    type Mol = { x: number; y: number; vx: number; vy: number; np: number; ang: number; rot: number };
    let nps: NP[] = [];
    let mols: Mol[] = [];
    let r = 12;

    const T = () => times.current ?? [Infinity, Infinity, Infinity, Infinity, Infinity, Infinity];
    const layout = () => {
      w = cv.clientWidth;
      h = cv.clientHeight;
      cv.width = w * dpr;
      cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      r = Math.max(8, Math.min(w, h) * 0.05);
      const cols = w > 420 ? 5 : 4;
      const rows = 3;
      nps = [];
      for (let i = 0; i < cols; i++)
        for (let j = 0; j < rows; j++) {
          const bx = ((i + 0.5) / cols) * w + (rand() - 0.5) * w * 0.07;
          const by = ((j + 0.5) / rows) * h * 0.86 + h * 0.07 + (rand() - 0.5) * h * 0.08;
          nps.push({ bx, by, x: bx, y: by, ph: rand() * 6.28 });
        }
      const m = nps.length * 2;
      mols = Array.from({ length: m }, (_, k) => ({
        x: -20 - rand() * w * 0.5,
        y: rand() * h,
        vx: 0.4 + rand() * 0.6,
        vy: (rand() - 0.5) * 0.5,
        np: k % nps.length,
        ang: (k / 2) * 2.4 + rand(),
        rot: rand() * 6.28,
      }));
      // Already past recognition at mount: start bound.
      if (T()[2] < 0) {
        mols.forEach((mo) => {
          const n = nps[mo.np];
          mo.x = n.bx + Math.cos(mo.ang) * (r + 7);
          mo.y = n.by + Math.sin(mo.ang) * (r + 7);
        });
      } else if (T()[1] < 0) {
        mols.forEach((mo) => {
          mo.x = rand() * w;
        });
      }
    };
    layout();
    const ro = new ResizeObserver(layout);
    ro.observe(cv);

    const base = hexToRgb(baseColour);
    const resp = hexToRgb(responseColour);
    const mb = hexToRgb(mediumBefore);
    const ma = hexToRgb(mediumAfter);
    const an = hexToRgb(analyteColour);
    const lerp = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
    const rgba = (c: number[], a: number) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
    const prog = (p: number, now: number, dur: number) => Math.max(0, Math.min(1, (now - T()[p]) / dur));
    const ease = (t: number) => t * t * (3 - 2 * t);

    let raf = 0;
    let beamX = 0;
    const frame = (now: number) => {
      const ph = phaseRef.current;
      const t3 = ease(prog(3, now, 1600));
      const t4 = prog(4, now, 900);
      ctx.clearRect(0, 0, w, h);

      // Sensing medium tint
      ctx.fillStyle = rgba(lerp(mb, ma, t3), 0.35);
      ctx.fillRect(0, 0, w, h);

      // Light beam (analytical signal)
      if (ph >= 4) {
        const y0 = h * 0.5;
        const bh = h * 0.2;
        const g = ctx.createLinearGradient(0, 0, w, 0);
        g.addColorStop(0, `rgba(255,248,220,${0.55 * t4})`);
        g.addColorStop(1, `rgba(255,248,220,${0.55 * t4 * (1 - 0.65 * t3)})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, y0 - bh / 2, w, bh);
        beamX = (beamX + (reduced ? 0 : 3)) % 40;
        ctx.strokeStyle = `rgba(255,236,170,${0.7 * t4})`;
        ctx.lineWidth = 2;
        ctx.setLineDash([10, 30]);
        ctx.lineDashOffset = -beamX;
        ctx.beginPath();
        ctx.moveTo(0, y0);
        ctx.lineTo(w, y0);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Nanoparticles
      const npCol = lerp(base, resp, t3);
      for (const n of nps) {
        if (!reduced) {
          n.ph += 0.02;
          n.x = n.bx + Math.cos(n.ph) * 2.2;
          n.y = n.by + Math.sin(n.ph * 1.3) * 2.2;
        }
        const haloR = r * (2.1 + 0.6 * t3);
        const halo = ctx.createRadialGradient(n.x, n.y, r * 0.6, n.x, n.y, haloR);
        halo.addColorStop(0, rgba(npCol, 0.35 + 0.25 * t3));
        halo.addColorStop(1, rgba(npCol, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, haloR, 0, Math.PI * 2);
        ctx.fill();
        const core = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.35, r * 0.1, n.x, n.y, r);
        core.addColorStop(0, "rgba(255,255,255,0.95)");
        core.addColorStop(0.35, rgba(npCol, 1));
        core.addColorStop(1, rgba(lerp(npCol, [20, 30, 50], 0.35), 1));
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fill();
        // Generic surface / recognition layer
        ctx.strokeStyle = rgba(npCol, 0.55);
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 3]);
        ctx.beginPath();
        ctx.arc(n.x, n.y, r + 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Target analyte molecules (sent back off-screen when the demo is reset)
      if (ph < 1) {
        for (const m of mols) m.x = -20 - ((m.ang * 37) % (w * 0.5));
      } else {
        for (const m of mols) {
          if (ph >= 2) {
            const n = nps[m.np];
            const tx = n.x + Math.cos(m.ang) * (r + 7);
            const ty = n.y + Math.sin(m.ang) * (r + 7);
            m.x += (tx - m.x) * 0.05;
            m.y += (ty - m.y) * 0.05;
          } else if (!reduced) {
            m.x += m.vx;
            m.y += m.vy;
            if (m.y < 4 || m.y > h - 4) m.vy *= -1;
            if (m.x > w + 10) m.x = -10;
          }
          m.rot += reduced ? 0 : 0.03;
          const bound = ph >= 2 ? prog(2, now, 1400) : 0;
          ctx.save();
          ctx.translate(m.x, m.y);
          ctx.rotate(m.rot);
          ctx.fillStyle = rgba(an, 0.95);
          ctx.strokeStyle = "rgba(255,255,255,0.8)";
          ctx.lineWidth = 1;
          const sz = 4.2;
          ctx.beginPath();
          ctx.moveTo(0, -sz);
          ctx.lineTo(sz, 0);
          ctx.lineTo(0, sz);
          ctx.lineTo(-sz, 0);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          ctx.restore();
          if (bound > 0.8 && ph < 3) {
            ctx.strokeStyle = rgba(an, 0.35 * (1 - (bound - 0.8) * 5));
            ctx.beginPath();
            ctx.arc(m.x, m.y, 8, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }
      // Camera / optical sensor receiving the beam
      if (ph >= 5) {
        const t5 = prog(5, now, 700);
        const cw = 44;
        const ch = 40;
        const cx = w - cw - 8;
        const cy = h * 0.5 - ch / 2;
        ctx.globalAlpha = t5;
        ctx.fillStyle = "rgba(20,28,40,0.92)";
        ctx.beginPath();
        ctx.roundRect(cx, cy, cw, ch, 7);
        ctx.fill();
        ctx.fillRect(cx + 10, cy - 6, 14, 7);
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx + cw / 2, cy + ch / 2, 11, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = rgba(lerp(mb, ma, t3), 0.9);
        ctx.beginPath();
        ctx.arc(cx + cw / 2, cy + ch / 2, 7, 0, Math.PI * 2);
        ctx.fill();
        const blink = reduced || Math.floor(now / 500) % 2 === 0;
        if (blink) {
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.arc(cx + cw - 7, cy + 7, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [baseColour, responseColour, mediumBefore, mediumAfter, analyteColour, seed, reduced]);

  return <canvas ref={ref} className={`block h-full w-full ${className}`} aria-hidden />;
}
