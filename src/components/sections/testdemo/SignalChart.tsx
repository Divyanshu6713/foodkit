"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";

/**
 * Simulated signal trace for the demo. The curve shape is a first-order
 * rise to the simulated response — an illustration, not measured data.
 */
export function SignalChart({
  kind,
  response,
  positive,
  animate = true,
}: {
  kind: "colorimetric" | "electrochemical";
  response: number;
  positive: boolean;
  animate?: boolean;
}) {
  const W = 440;
  const H = 200;
  const pad = { l: 40, r: 16, t: 16, b: 30 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const final = positive ? Math.max(0.04, response) : 0.03;
  const [hover, setHover] = useState<number | null>(null);

  const pts = useMemo(() => {
    const out: [number, number][] = [];
    for (let i = 0; i <= 60; i++) {
      const u = i / 60;
      const noise = Math.sin(i * 2.7) * 0.008 + Math.sin(i * 7.1) * 0.005;
      const y = final * (1 - Math.exp(-u * 5)) + noise;
      out.push([u, Math.max(0, y)]);
    }
    return out;
  }, [final]);
  const ctrl = useMemo(() => pts.map(([u], i) => [u, 0.02 + Math.sin(i * 3.3) * 0.006] as [number, number]), [pts]);

  const x = (u: number) => pad.l + u * iw;
  const y = (v: number) => pad.t + ih - v * ih;
  const path = (a: [number, number][]) => a.map(([u, v], i) => `${i ? "L" : "M"}${x(u).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const label = kind === "electrochemical" ? "Current response (normalised)" : "Zone color change (normalised)";
  const hv = hover !== null ? pts[hover] : null;

  return (
    <figure className="w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`${label} over time, simulated. Final value ${(final * 100).toFixed(0)} percent of full scale.`}
        onMouseMove={(e) => {
          const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const u = ((e.clientX - r.left) / r.width) * W;
          const idx = Math.round(((u - pad.l) / iw) * 60);
          setHover(idx >= 0 && idx <= 60 ? idx : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={y(g)} y2={y(g)} stroke="var(--line)" />
            <text x={pad.l - 8} y={y(g) + 3} textAnchor="end" fontSize="9" fill="var(--muted)" className="mono">
              {g.toFixed(2)}
            </text>
          </g>
        ))}
        <text x={pad.l} y={H - 8} fontSize="9" fill="var(--muted)" className="mono">
          time →
        </text>
        <path d={path(ctrl)} fill="none" stroke="var(--muted)" strokeWidth="1.5" strokeDasharray="3 4" />
        <text x={W - pad.r} y={y(0.02) - 6} textAnchor="end" fontSize="9" fill="var(--muted)" className="mono">
          control zone
        </text>
        <motion.path
          d={path(pts)}
          fill="none"
          stroke="var(--nano)"
          strokeWidth="2"
          strokeLinecap="round"
          initial={animate ? { pathLength: 0 } : false}
          animate={{ pathLength: 1 }}
          transition={{ duration: 2.6, ease: "easeOut" }}
        />
        <motion.circle
          cx={x(1)}
          cy={y(pts[60][1])}
          r="4"
          fill="var(--nano)"
          stroke="var(--bg)"
          strokeWidth="2"
          initial={animate ? { opacity: 0 } : false}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5 }}
        />
        {hv && (
          <g>
            <line x1={x(hv[0])} x2={x(hv[0])} y1={pad.t} y2={pad.t + ih} stroke="var(--line-2)" />
            <circle cx={x(hv[0])} cy={y(hv[1])} r="4" fill="var(--nano)" stroke="var(--bg)" strokeWidth="2" />
            <text x={Math.min(x(hv[0]) + 6, W - 70)} y={pad.t + 10} fontSize="10" fill="var(--text)" className="mono">
              {hv[1].toFixed(3)}
            </text>
          </g>
        )}
      </svg>
      <figcaption className="mt-1 flex items-center justify-between text-[11px] text-muted">
        <span>{label}</span>
        <span className="mono text-warn">Illustrative / simulated</span>
      </figcaption>
    </figure>
  );
}
