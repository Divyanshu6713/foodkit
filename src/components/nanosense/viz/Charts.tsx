"use client";
import { useMemo, useState, type ReactNode } from "react";
import { TRACE, type CalPoint, type Fit, type Trace } from "../model";
import { useSize } from "./useSize";

/* ------------------------------------------------------------------ */
/* Shared bits                                                         */
/* ------------------------------------------------------------------ */

const M = { t: 16, r: 16, b: 38, l: 50 };

function niceTicks(min: number, max: number, count = 5) {
  const span = max - min || 1;
  const step0 = span / count;
  const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= count) ?? step0;
  const out: number[] = [];
  for (let v = Math.ceil(min / step) * step; v <= max + 1e-9; v += step) out.push(+v.toFixed(6));
  return out;
}

function Axes({
  w,
  h,
  x,
  y,
  xTicks,
  yTicks,
  xLabel,
  yLabel,
  fmtX = (v) => String(v),
  fmtY = (v) => String(v),
}: {
  w: number;
  h: number;
  x: (v: number) => number;
  y: (v: number) => number;
  xTicks: number[];
  yTicks: number[];
  xLabel: string;
  yLabel: string;
  fmtX?: (v: number) => string;
  fmtY?: (v: number) => string;
}) {
  return (
    <g className="text-[10px]" fill="var(--ns-muted)">
      {yTicks.map((v) => (
        <g key={`y${v}`}>
          <line x1={M.l} x2={w - M.r} y1={y(v)} y2={y(v)} stroke="var(--ns-line)" />
          <text x={M.l - 8} y={y(v)} textAnchor="end" dominantBaseline="middle" className="mono">
            {fmtY(v)}
          </text>
        </g>
      ))}
      {xTicks.map((v) => (
        <text key={`x${v}`} x={x(v)} y={h - M.b + 16} textAnchor="middle" className="mono">
          {fmtX(v)}
        </text>
      ))}
      <line x1={M.l} x2={w - M.r} y1={h - M.b} y2={h - M.b} stroke="var(--ns-line-2)" />
      <text x={(M.l + w - M.r) / 2} y={h - 4} textAnchor="middle" fill="var(--ns-text-2)" className="text-[11px]">
        {xLabel}
      </text>
      <text transform={`translate(12 ${(M.t + h - M.b) / 2}) rotate(-90)`} textAnchor="middle" fill="var(--ns-text-2)" className="text-[11px]">
        {yLabel}
      </text>
    </g>
  );
}

function Tooltip({ x, y, w, children }: { x: number; y: number; w: number; children: ReactNode }) {
  const left = x > w - 170 ? x - 162 : x + 12;
  return (
    <div
      className="ns-glass pointer-events-none absolute z-10 rounded-lg px-2.5 py-1.5 text-[11px] leading-snug text-ns-text shadow-lg"
      style={{ left, top: Math.max(0, y - 20), minWidth: 140 }}
    >
      {children}
    </div>
  );
}

const path = (pts: [number, number][]) => pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join("");

/* ------------------------------------------------------------------ */
/* Raw sensor trace (volts)                                            */
/* ------------------------------------------------------------------ */

export function VoltageChart({ trace, stage, progress = 1, height = 250 }: { trace: Trace; stage: number; progress?: number; height?: number }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const { t, raw, filtered, corrected } = trace;
  const x = (v: number) => M.l + (v / TRACE.seconds) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - (v + 0.1) / 3.0) * (h - M.t - M.b);
  const upto = Math.max(1, Math.round(progress * t.length));
  const line = (arr: number[]) => path(arr.slice(0, upto).map((v, i) => [x(t[i]), y(v)]));
  const regions = [
    { a: 0, b: TRACE.darkEnd, label: "Dark (LED off)" },
    { a: TRACE.darkEnd, b: TRACE.blankEnd, label: "Blank" },
    { a: TRACE.blankEnd, b: TRACE.seconds, label: "Sample" },
  ];
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const tv = ((e.clientX - r.left - M.l) / (w - M.l - M.r)) * TRACE.seconds;
    if (tv < 0 || tv > TRACE.seconds) return setHover(null);
    setHover(Math.min(upto - 1, Math.round((tv / TRACE.seconds) * (t.length - 1))));
  };
  return (
    <div ref={ref} className="relative w-full" style={{ height: h }}>
      {w > 0 && (
        <svg width={w} height={h} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Simulated raw sensor voltage over time">
          {regions.map((r, i) => (
            <g key={r.label}>
              <rect x={x(r.a)} y={M.t} width={x(r.b) - x(r.a)} height={h - M.t - M.b} fill={i === 2 ? "var(--ns-s3)" : "var(--ns-text)"} opacity={i === 2 ? 0.05 : 0.025} />
              <text x={x(r.a) + 6} y={M.t + 12} className="mono text-[9.5px] tracking-wider uppercase" fill="var(--ns-muted)">
                {r.label}
              </text>
            </g>
          ))}
          <Axes w={w} h={h} x={x} y={y} xTicks={niceTicks(0, TRACE.seconds, 5)} yTicks={niceTicks(0, 2.8, 4)} xLabel="Time (s)" yLabel="Voltage (V)" fmtY={(v) => v.toFixed(1)} />
          <path d={line(raw)} fill="none" stroke="var(--ns-muted)" strokeOpacity={stage >= 1 ? 0.35 : 0.9} strokeWidth={1.2} />
          {stage >= 1 && <path d={line(filtered)} fill="none" stroke="var(--ns-s1)" strokeWidth={2} strokeLinejoin="round" />}
          {stage >= 2 && <path d={line(corrected)} fill="none" stroke="var(--ns-s3)" strokeWidth={2} strokeDasharray="5 3" />}
          {hover !== null && (
            <g>
              <line x1={x(t[hover])} x2={x(t[hover])} y1={M.t} y2={h - M.b} stroke="var(--ns-line-2)" />
              <circle cx={x(t[hover])} cy={y(stage >= 1 ? filtered[hover] : raw[hover])} r={4} fill="var(--ns-s1)" stroke="var(--ns-surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <Tooltip x={x(t[hover])} y={y(raw[hover])} w={w}>
          <div className="mono text-ns-muted">t = {t[hover].toFixed(2)} s</div>
          <div>Raw: <b className="mono">{raw[hover].toFixed(3)} V</b></div>
          {stage >= 1 && <div>Filtered: <b className="mono">{filtered[hover].toFixed(3)} V</b></div>}
          {stage >= 2 && <div>Dark-corrected: <b className="mono">{corrected[hover].toFixed(3)} V</b></div>}
          <div className="mt-0.5 text-[10px] text-ns-amber">Simulated</div>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Processed absorbance                                                */
/* ------------------------------------------------------------------ */

export function AbsorbanceChart({ trace, height = 200 }: { trace: Trace; height?: number }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const idx = trace.t.map((_, i) => i).filter((i) => trace.absorbance[i] !== null);
  const t0 = TRACE.blankEnd;
  const vals = idx.map((i) => trace.absorbance[i] as number);
  const top = Math.max(1, ...vals) * 1.1;
  const x = (v: number) => M.l + ((v - t0) / (TRACE.seconds - t0)) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - Math.max(-0.05, v) / top) * (h - M.t - M.b);
  const d = path(idx.map((i) => [x(trace.t[i]), y(trace.absorbance[i] as number)]));
  const pv = trace.stats.processed;
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const tv = t0 + ((e.clientX - r.left - M.l) / (w - M.l - M.r)) * (TRACE.seconds - t0);
    const near = idx.reduce((b, i) => (Math.abs(trace.t[i] - tv) < Math.abs(trace.t[b] - tv) ? i : b), idx[0]);
    setHover(tv < t0 || tv > TRACE.seconds ? null : near);
  };
  return (
    <div ref={ref} className="relative w-full" style={{ height: h }}>
      {w > 0 && (
        <svg width={w} height={h} onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label="Processed absorbance over time">
          <Axes w={w} h={h} x={x} y={y} xTicks={niceTicks(t0, TRACE.seconds, 6)} yTicks={niceTicks(0, top, 4)} xLabel="Time (s)" yLabel="Absorbance (AU)" fmtY={(v) => v.toFixed(2)} />
          <line x1={x(t0 + TRACE.settle + 0.5)} x2={w - M.r} y1={y(pv)} y2={y(pv)} stroke="var(--ns-s2)" strokeDasharray="4 4" strokeWidth={1.5} />
          <path d={d} fill="none" stroke="var(--ns-s3)" strokeWidth={2} strokeLinejoin="round" />
          <text x={w - M.r - 4} y={y(pv) - 8} textAnchor="end" className="mono text-[10.5px]" fill="var(--ns-text)">
            plateau mean {pv.toFixed(3)} AU
          </text>
          {hover !== null && (
            <g>
              <line x1={x(trace.t[hover])} x2={x(trace.t[hover])} y1={M.t} y2={h - M.b} stroke="var(--ns-line-2)" />
              <circle cx={x(trace.t[hover])} cy={y(trace.absorbance[hover] as number)} r={4} fill="var(--ns-s3)" stroke="var(--ns-surface)" strokeWidth={2} />
            </g>
          )}
        </svg>
      )}
      {hover !== null && w > 0 && (
        <Tooltip x={x(trace.t[hover])} y={y(trace.absorbance[hover] as number)} w={w}>
          <div className="mono text-ns-muted">t = {trace.t[hover].toFixed(2)} s</div>
          <div>Absorbance: <b className="mono">{(trace.absorbance[hover] as number).toFixed(3)} AU</b></div>
          <div className="mt-0.5 text-[10px] text-ns-amber">Simulated</div>
        </Tooltip>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Calibration curve                                                   */
/* ------------------------------------------------------------------ */

export interface CalMarker {
  label: string;
  signal: number;
  colour: string;
}

export function CalibrationChart({
  points,
  fit,
  unit,
  unknown,
  markers = [],
  levels = [],
  height = 340,
  revealed = 1,
  lineDrawn = true,
  yLabel = "Measured optical feature (F)",
  pointColour = "var(--ns-s1)",
}: {
  points: CalPoint[];
  fit: Fit;
  unit: string;
  unknown?: { signal: number; conc: number; label?: string };
  markers?: CalMarker[];
  levels?: { conc: number; mean: number; sd: number; n: number }[];
  height?: number;
  /** 0…1 share of calibration points shown (for the build-up animation) */
  revealed?: number;
  lineDrawn?: boolean;
  yLabel?: string;
  pointColour?: string;
}) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const h = height;
  const ys = [...points.map((p) => p.signal), ...(unknown ? [unknown.signal] : []), ...markers.map((m) => m.signal)];
  const xMax = useMemo(
    () => Math.max(1e-6, ...points.map((p) => p.conc), unknown && Number.isFinite(unknown.conc) ? unknown.conc : 0) * 1.12,
    [points, unknown],
  );
  const yTop = Math.max(0.1, ...ys) * 1.1;
  const yBot = Math.min(0, ...ys) * 1.1;
  const x = (v: number) => M.l + (Math.max(0, Math.min(xMax, v)) / xMax) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - (Math.max(yBot, Math.min(yTop, v)) - yBot) / (yTop - yBot)) * (h - M.t - M.b);
  const shown = Math.round(revealed * points.length);
  const lineLen = Math.hypot(x(fit.maxConc) - x(fit.minConc), y(fit.intercept + fit.slope * fit.maxConc) - y(fit.intercept + fit.slope * fit.minConc)) || 1;
  const concOf = (sig: number) => (fit.ok ? (sig - fit.intercept) / fit.slope : 0);
  const labelRight = (px: number) => px < w - 170;

  if (points.length === 0 && !unknown)
    return (
      <div className="grid place-items-center rounded-xl border border-dashed border-ns-line2 text-[13px] text-ns-muted" style={{ height: h }}>
        No calibration points to plot.
      </div>
    );

  return (
    <div ref={ref} className="relative w-full" style={{ height: h }}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="Calibration curve: measured optical feature against known concentration">
          <Axes
            w={w}
            h={h}
            x={x}
            y={y}
            xTicks={niceTicks(0, xMax, 6)}
            yTicks={niceTicks(yBot, yTop, 5)}
            xLabel={`Known concentration (${unit})`}
            yLabel={yLabel}
            fmtX={(v) => String(+v.toPrecision(4))}
            fmtY={(v) => v.toFixed(2)}
          />
          {fit.ok && <rect x={x(fit.minConc)} y={M.t} width={Math.max(0, x(fit.maxConc) - x(fit.minConc))} height={h - M.t - M.b} fill="var(--ns-s1)" opacity={0.04} />}
          {fit.ok && (
            <line
              x1={x(fit.minConc)}
              y1={y(fit.intercept + fit.slope * fit.minConc)}
              x2={x(fit.maxConc)}
              y2={y(fit.intercept + fit.slope * fit.maxConc)}
              stroke="var(--ns-s1)"
              strokeWidth={2}
              strokeDasharray={lineLen}
              strokeDashoffset={lineDrawn ? 0 : lineLen}
              style={{ transition: "stroke-dashoffset 1.2s ease" }}
            />
          )}
          {levels
            .filter((l) => l.n > 1)
            .map((l) => (
              <g key={`e${l.conc}`} stroke="var(--ns-text-2)" strokeWidth={1.2} opacity={0.7}>
                <line x1={x(l.conc)} x2={x(l.conc)} y1={y(l.mean - l.sd)} y2={y(l.mean + l.sd)} />
                <line x1={x(l.conc) - 5} x2={x(l.conc) + 5} y1={y(l.mean - l.sd)} y2={y(l.mean - l.sd)} />
                <line x1={x(l.conc) - 5} x2={x(l.conc) + 5} y1={y(l.mean + l.sd)} y2={y(l.mean + l.sd)} />
              </g>
            ))}
          {points.slice(0, shown).map((p, i) => (
            <g key={i} onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
              <circle cx={x(p.conc)} cy={y(p.signal)} r={14} fill="transparent" />
              <circle cx={x(p.conc)} cy={y(p.signal)} r={4.5} fill="var(--ns-surface)" stroke={pointColour} strokeWidth={2} />
            </g>
          ))}
          {markers.map((m) => (
            <g key={m.label}>
              <circle cx={x(concOf(m.signal))} cy={y(m.signal)} r={6.5} fill={m.colour} stroke="var(--ns-surface)" strokeWidth={2} />
              <text x={x(concOf(m.signal)) + 10} y={y(m.signal) + 14} className="text-[10.5px] font-medium" fill="var(--ns-text)">
                {m.label}
              </text>
            </g>
          ))}
          {unknown && fit.ok && Number.isFinite(unknown.conc) && (
            <g>
              <line x1={M.l} x2={x(unknown.conc)} y1={y(unknown.signal)} y2={y(unknown.signal)} stroke="var(--ns-s3)" strokeDasharray="4 4" />
              <line x1={x(unknown.conc)} x2={x(unknown.conc)} y1={y(unknown.signal)} y2={h - M.b} stroke="var(--ns-s3)" strokeDasharray="4 4" />
              <circle
                cx={x(unknown.conc)}
                cy={y(unknown.signal)}
                r={14}
                fill="var(--ns-s3)"
                opacity={0.18}
                className="ns-pulse"
                style={{ transformOrigin: `${x(unknown.conc)}px ${y(unknown.signal)}px` }}
              />
              <circle cx={x(unknown.conc)} cy={y(unknown.signal)} r={7} fill="var(--ns-s3)" stroke="var(--ns-surface)" strokeWidth={2} />
              {/* Below-right keeps the label off a rising line; above-left when near the edge. */}
              <text
                x={x(unknown.conc) + (labelRight(x(unknown.conc)) ? 12 : -12)}
                y={y(unknown.signal) + (labelRight(x(unknown.conc)) ? 24 : -12)}
                textAnchor={labelRight(x(unknown.conc)) ? "start" : "end"}
                className="mono text-[11px] font-semibold"
                fill="var(--ns-text)"
              >
                {unknown.label ?? "Unknown"} · F {unknown.signal.toFixed(3)}
              </text>
            </g>
          )}
        </svg>
      )}
      {hover !== null && w > 0 && points[hover] && (
        <Tooltip x={x(points[hover].conc)} y={y(points[hover].signal)} w={w}>
          <div className="font-medium">{points[hover].sampleId || `Point ${hover + 1}`}</div>
          <div>
            Concentration: <b className="mono">{points[hover].conc} {unit}</b>
          </div>
          <div>
            Feature: <b className="mono">{points[hover].signal.toFixed(4)}</b>
          </div>
          {points[hover].replicate && <div className="text-ns-muted">Replicate {points[hover].replicate}</div>}
        </Tooltip>
      )}
    </div>
  );
}

/** Residuals (measured − fitted) against concentration. */
export function ResidualChart({ points, residuals, unit, height = 150 }: { points: CalPoint[]; residuals: number[]; unit: string; height?: number }) {
  const [ref, { w }] = useSize<HTMLDivElement>();
  const h = height;
  const xMax = Math.max(1e-6, ...points.map((p) => p.conc)) * 1.12;
  const r = Math.max(1e-6, ...residuals.filter(Number.isFinite).map(Math.abs)) * 1.3;
  const x = (v: number) => M.l + (v / xMax) * (w - M.l - M.r);
  const y = (v: number) => M.t + (1 - (v + r) / (2 * r)) * (h - M.t - M.b);
  return (
    <div ref={ref} className="w-full" style={{ height: h }}>
      {w > 0 && (
        <svg width={w} height={h} role="img" aria-label="Residual plot">
          <Axes
            w={w}
            h={h}
            x={x}
            y={y}
            xTicks={niceTicks(0, xMax, 6)}
            yTicks={[-r / 1.3, 0, r / 1.3]}
            xLabel={`Known concentration (${unit})`}
            yLabel="Residual"
            fmtX={(v) => String(+v.toPrecision(4))}
            fmtY={(v) => v.toFixed(3)}
          />
          <line x1={M.l} x2={w - M.r} y1={y(0)} y2={y(0)} stroke="var(--ns-s1)" strokeWidth={1.5} />
          {points.map((p, i) =>
            Number.isFinite(residuals[i]) ? (
              <g key={i}>
                <line x1={x(p.conc)} x2={x(p.conc)} y1={y(0)} y2={y(residuals[i])} stroke="var(--ns-line-2)" />
                <circle cx={x(p.conc)} cy={y(residuals[i])} r={3.5} fill="var(--ns-s2)" />
              </g>
            ) : null,
          )}
        </svg>
      )}
    </div>
  );
}
