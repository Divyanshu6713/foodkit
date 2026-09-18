"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { useSeen } from "@/lib/useInView";

/**
 * Log-scale range / point chart for literature values. Each row is a
 * range bar, a point, or an upper bound ("< x", drawn as a point with a
 * left-pointing chevron so the bar doesn't imply a lower value).
 */

export type Kind = "lit" | "proposed" | "ref";

export interface Row {
  label: string;
  min?: number;
  max?: number;
  point?: number;
  lt?: number;
  kind: Kind;
  note: string;
  src?: string;
}

export const KIND_COLOR: Record<Kind, string> = {
  lit: "var(--series-1)",
  proposed: "var(--series-3)",
  ref: "var(--series-2)",
};
export const KIND_LABEL: Record<Kind, string> = {
  lit: "Literature benchmark",
  proposed: "This project's target (proposed)",
  ref: "Reference / context",
};

export function RangeChart({
  rows,
  domain,
  ticks,
  tickFmt,
  unit,
  marker,
  title,
}: {
  rows: Row[];
  domain: [number, number];
  ticks: number[];
  tickFmt: (v: number) => string;
  unit: string;
  marker?: { value: number; label: string };
  title: string;
}) {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const W = 720;
  const rowH = 34;
  const pad = { l: 200, r: 24, t: 26, b: 34 };
  const H = pad.t + rows.length * rowH + pad.b;
  const lo = Math.log10(domain[0]);
  const hi = Math.log10(domain[1]);
  const X = (v: number) => pad.l + ((Math.log10(v) - lo) / (hi - lo)) * (W - pad.l - pad.r);
  const kinds = Array.from(new Set(rows.map((r) => r.kind)));

  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="flex flex-wrap gap-3 text-[11px] text-text-2">
          {kinds.map((k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: KIND_COLOR[k] }} /> {KIND_LABEL[k]}
            </span>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[560px]" role="img" aria-label={`${title}. Log scale in ${unit}.`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={X(t)} x2={X(t)} y1={pad.t - 6} y2={H - pad.b} stroke="var(--line)" />
              <text x={X(t)} y={H - pad.b + 16} textAnchor="middle" fontSize="10" fill="var(--muted)" className="mono">
                {tickFmt(t)}
              </text>
            </g>
          ))}
          <text x={W - pad.r} y={H - 4} textAnchor="end" fontSize="10" fill="var(--text-2)">
            {unit} (log scale)
          </text>
          {marker && (
            <g>
              <line x1={X(marker.value)} x2={X(marker.value)} y1={pad.t - 14} y2={H - pad.b} stroke="var(--warn)" strokeDasharray="4 4" strokeWidth="1.5" />
              <text x={X(marker.value) + 5} y={pad.t - 12} fontSize="10" fill="var(--warn)">
                {marker.label}
              </text>
            </g>
          )}
          {rows.map((r, i) => {
            const y = pad.t + i * rowH + rowH / 2;
            const c = KIND_COLOR[r.kind];
            const on = hover === i;
            return (
              <g key={r.label} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "default" }}>
                <rect x={0} y={y - rowH / 2} width={W} height={rowH} fill={on ? "var(--line)" : "transparent"} />
                <text x={pad.l - 12} y={y + 4} textAnchor="end" fontSize="11.5" fill={on ? "var(--text)" : "var(--text-2)"}>
                  {r.label}
                </text>
                {r.min !== undefined && r.max !== undefined && (
                  <motion.rect
                    y={y - 5}
                    height={10}
                    rx={4}
                    fill={c}
                    initial={{ x: X(r.min), width: 0 }}
                    animate={seen ? { x: X(r.min), width: Math.max(4, X(r.max) - X(r.min)) } : {}}
                    transition={{ duration: 0.9, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                  />
                )}
                {r.point !== undefined && (
                  <motion.circle cx={X(r.point)} cy={y} r={6} fill={c} stroke="var(--surface)" strokeWidth={2} initial={{ scale: 0 }} animate={seen ? { scale: 1 } : {}} transition={{ delay: 0.3 + i * 0.06 }} />
                )}
                {r.lt !== undefined && (
                  <motion.g initial={{ opacity: 0 }} animate={seen ? { opacity: 1 } : {}} transition={{ delay: 0.3 + i * 0.06 }}>
                    <path d={`M${X(r.lt) - 16} ${y} L${X(r.lt)} ${y}`} stroke={c} strokeWidth={2} strokeDasharray="2 3" />
                    <path d={`M${X(r.lt) - 16} ${y - 5} L${X(r.lt) - 22} ${y} L${X(r.lt) - 16} ${y + 5}`} fill="none" stroke={c} strokeWidth={2} />
                    <circle cx={X(r.lt)} cy={y} r={5.5} fill={c} stroke="var(--surface)" strokeWidth={2} />
                  </motion.g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 min-h-[40px] rounded-lg border border-line bg-bg/40 px-3 py-2 text-xs text-text-2" aria-live="polite">
        {hover !== null ? (
          <>
            <span className="text-text">{rows[hover].label}:</span> {rows[hover].note}
            {rows[hover].src && <span className="mono ml-1 text-muted">{rows[hover].src}</span>}
          </>
        ) : (
          <span className="text-muted">Hover a row for the source value.</span>
        )}
      </div>
    </div>
  );
}
