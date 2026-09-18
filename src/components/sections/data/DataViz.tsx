"use client";
import { useState } from "react";
import { motion } from "motion/react";
import { FSSAI_2425 } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { useSeen } from "@/lib/useInView";
import { RangeChart, type Row } from "./RangeChart";

/* All numbers below are transcribed from the research document. */

const UREA_ROWS: Row[] = [
  { label: "Urease electrochemical", point: 5.0, kind: "lit", note: "LOD 5.0 µM, stable 28 days", src: "[4][5]" },
  { label: "Citrate-AgNP · LOD", point: 5.56, kind: "lit", note: "LOD 5.56 µM, colorimetric, < 5 min", src: "[10]" },
  { label: "Citrate-AgNP · linear range", min: 1000, max: 15000, kind: "lit", note: "Linear range 1–15 mM", src: "[10]" },
  { label: "Ag/GO · LOD", point: 110, kind: "lit", note: "LOD 0.11 mM (110 µM), non-enzymatic", src: "[14]" },
  { label: "Ag/GO · linear range", min: 1000, max: 10000, kind: "lit", note: "Linear range 1–10 mM, sensitivity 36.8 µA/mM", src: "[14]" },
  { label: "Normal milk", min: 3000, max: 6000, kind: "ref", note: "Natural urea in milk: 3–6 mM" },
  { label: "Prototype working range", min: 1000, max: 15000, kind: "proposed", note: "Target detection range 1–15 mM" },
];

const TIME_ROWS: Row[] = [
  { label: "Accredited lab", min: 24 * 3600, max: 72 * 3600, kind: "ref", note: "24–72 hours", src: "[1]" },
  { label: "Lateral-flow assays", min: 600, max: 1800, kind: "lit", note: "10–30 min (pathogens)", src: "[19][20]" },
  { label: "Melamine aptasensor", min: 600, max: 1200, kind: "lit", note: "10–20 min", src: "[15]" },
  { label: "Smartphone pesticide sensor", min: 300, max: 600, kind: "lit", note: "5–10 min", src: "[21]" },
  { label: "Citrate-AgNP urea", lt: 300, kind: "lit", note: "< 5 min", src: "[10]" },
  { label: "IIT Kharagpur µPAD", min: 15, max: 120, kind: "lit", note: "15–60 s urea/detergent; ~2 min others", src: "[17]" },
  { label: "Ag/GO urea sensor", lt: 60, kind: "lit", note: "< 1 min", src: "[14]" },
  { label: "Colorimetric mode", lt: 120, kind: "proposed", note: "Expected < 2 min (urea, colorimetric)" },
  { label: "Electrochemical mode", lt: 30, kind: "proposed", note: "Expected < 30 s (urea, electrochemical)" },
];

const COST_ROWS: Row[] = [
  { label: "Lab test (consumer)", min: 500, max: 25000, kind: "ref", note: "₹500–25,000 per test; milk adulteration ~₹1,000", src: "[1]" },
  { label: "Commercial LFA", min: 200, max: 1000, kind: "lit", note: "₹200–1,000 per test", src: "[19]" },
  { label: "FSSAI RAFT kits", min: 30, max: 300, kind: "lit", note: "₹30–300 per test", src: "[6][8][9]" },
  { label: "IIT Kharagpur µPAD", point: 21, kind: "lit", note: "₹12 strip + ₹8.5 holder = ₹21 per kit", src: "[17]" },
  { label: "Paper-immobilised NP assay", lt: 10, kind: "lit", note: "< ₹10 per test", src: "[10][11]" },
  { label: "Consumables target", lt: 20, kind: "proposed", note: "< ₹20 per test (research goal)" },
];

export function DataViz() {
  return (
    <Section id="data" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="12"
          eyebrow="Data"
          title="What the literature says"
          lead="Every value in these charts comes from the research study, and each one comes from a cited third-party source or the project's stated targets. None of it was measured by this project."
          aside={<EvidenceBadge type="lit" long />}
        />

        <div className="grid gap-6">
          <Card>
            <RangeChart
              title="Urea: detection limits vs what matters in milk"
              rows={UREA_ROWS}
              domain={[1, 100000]}
              ticks={[1, 10, 100, 1000, 10000, 100000]}
              tickFmt={(v) => (v >= 1000 ? `${v / 1000} mM` : `${v} µM`)}
              unit="Urea concentration"
              marker={{ value: 11600, label: "FSSAI limit 11.6 mM" }}
            />
            <p className="mt-3 text-xs text-text-2">
              Reading: all three literature sensors detect urea far below the 11.6 mM limit. The hard part isn&apos;t sensitivity. It&apos;s telling normal milk (3–6 mM) apart from adulterated milk (&gt; 11.6 mM) in a real milk matrix.
            </p>
          </Card>

          <div className="grid gap-6">
            <Card>
              <RangeChart
                title="Time to result"
                rows={TIME_ROWS}
                domain={[10, 400000]}
                ticks={[10, 60, 600, 3600, 86400]}
                tickFmt={(v) => (v < 60 ? `${v} s` : v < 3600 ? `${v / 60} min` : v < 86400 ? `${v / 3600} h` : `${v / 86400} d`)}
                unit="Time"
              />
            </Card>
            <Card>
              <RangeChart
                title="Cost per test"
                rows={COST_ROWS}
                domain={[5, 50000]}
                ticks={[10, 100, 1000, 10000]}
                tickFmt={(v) => `₹${v.toLocaleString("en-IN")}`}
                unit="INR per test"
              />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
            <Card>
              <FssaiBar />
            </Card>
            <Card>
              <AgGoLine />
            </Card>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-3xl border border-line-2 bg-surface/60 p-5 sm:p-6">{children}</div>;
}

function FssaiBar() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const { tested, unsafe, substandard } = FSSAI_2425;
  const rest = tested - unsafe - substandard;
  const segs = [
    { label: "Unsafe", v: unsafe, color: "var(--series-2)" },
    { label: "Substandard", v: substandard, color: "var(--series-1)" },
    { label: "Other tested samples", v: rest, color: "var(--line-2)" },
  ];
  const pct = (v: number) => (v / tested) * 100;
  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">FSSAI enforcement testing, 2024–25</h3>
        <span className="mono text-[11px] text-muted">[1]</span>
      </div>
      <div className="mt-4 flex items-end gap-6">
        <div>
          <div className="text-4xl font-semibold tracking-tight">{tested.toLocaleString("en-IN")}</div>
          <div className="text-xs text-text-2">samples tested</div>
        </div>
        <div>
          <div className="text-4xl font-semibold tracking-tight">
            {FSSAI_2425.reportedNonConforming}
          </div>
          <div className="text-xs text-text-2">reported non-conforming</div>
        </div>
      </div>
      <div className="mt-6 flex h-7 w-full gap-[2px] overflow-hidden rounded-md" role="img" aria-label={`Unsafe ${unsafe}, substandard ${substandard}, other ${rest}`}>
        {segs.map((s, i) => (
          <motion.div
            key={s.label}
            className="h-full first:rounded-l-md last:rounded-r-md"
            style={{ background: s.color, opacity: hover === null || hover === i ? 1 : 0.4 }}
            initial={{ width: 0 }}
            animate={seen ? { width: `${pct(s.v)}%` } : {}}
            transition={{ duration: 1, delay: i * 0.15, ease: [0.22, 1, 0.36, 1] }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-1.5 text-xs sm:grid-cols-3">
        {segs.map((s, i) => (
          <li key={s.label} className={`flex items-center gap-2 ${hover === i ? "text-text" : "text-text-2"}`} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: s.color }} />
            {s.label}: <span className="mono">{s.v.toLocaleString("en-IN")}</span> <span className="text-muted">({pct(s.v).toFixed(1)}%)</span>
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted">Unsafe + substandard alone is ≈ {pct(unsafe + substandard).toFixed(1)} %. The source summarises total non-conformance as ~20 %.</p>
    </div>
  );
}

/** Response implied by the reported Ag/GO sensitivity over its linear range. */
function AgGoLine() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const S = 36.8; // µA per mM, reported
  const W = 380;
  const H = 230;
  const pad = { l: 46, r: 16, t: 16, b: 40 };
  const X = (c: number) => pad.l + (c / 12) * (W - pad.l - pad.r);
  const Y = (i: number) => H - pad.b - (i / 400) * (H - pad.t - pad.b);
  const cs = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  return (
    <div ref={ref}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Ag/GO: current change implied by reported sensitivity</h3>
        <span className="mono text-[11px] text-muted">[14]</span>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-3 w-full" role="img" aria-label="Line: change in current equals 36.8 microamps per millimolar times concentration, from 1 to 10 mM.">
        {[0, 100, 200, 300, 400].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(g)} y2={Y(g)} stroke="var(--line)" />
            <text x={pad.l - 6} y={Y(g) + 3} textAnchor="end" fontSize="9" fill="var(--muted)" className="mono">
              {g}
            </text>
          </g>
        ))}
        {[0, 2, 4, 6, 8, 10, 12].map((c) => (
          <text key={c} x={X(c)} y={H - pad.b + 14} textAnchor="middle" fontSize="9" fill="var(--muted)" className="mono">
            {c}
          </text>
        ))}
        <text x={pad.l + (W - pad.l - pad.r) / 2} y={H - 6} textAnchor="middle" fontSize="10" fill="var(--text-2)">
          Urea (mM)
        </text>
        <text x={12} y={pad.t + 70} fontSize="10" fill="var(--text-2)" transform={`rotate(-90 12 ${pad.t + 70})`}>
          ΔI (µA)
        </text>
        <rect x={X(1)} y={pad.t} width={X(10) - X(1)} height={H - pad.t - pad.b} fill="var(--series-1)" opacity="0.06" />
        <line x1={X(11.6)} x2={X(11.6)} y1={pad.t} y2={H - pad.b} stroke="var(--warn)" strokeDasharray="4 4" />
        <text x={X(11.6) - 4} y={pad.t + 10} textAnchor="end" fontSize="9" fill="var(--warn)">
          11.6 mM limit
        </text>
        <motion.path
          d={`M${X(1)},${Y(S * 1)} L${X(10)},${Y(S * 10)}`}
          stroke="var(--series-1)"
          strokeWidth="2"
          fill="none"
          initial={{ pathLength: 0 }}
          animate={seen ? { pathLength: 1 } : {}}
          transition={{ duration: 1.2 }}
        />
        {cs.map((c, i) => (
          <circle key={c} cx={X(c)} cy={Y(S * c)} r={hover === i ? 6 : 4} fill="var(--series-1)" stroke="var(--surface)" strokeWidth="2" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} />
        ))}
        {hover !== null && (
          <text x={X(cs[hover]) - 6} y={Y(S * cs[hover]) - 10} textAnchor="end" fontSize="10" fill="var(--text)" className="mono">
            {cs[hover]} mM → {(S * cs[hover]).toFixed(0)} µA
          </text>
        )}
      </svg>
      <p className="mt-2 text-xs text-text-2">
        Derived as ΔI = 36.8 µA/mM × C over the reported 1–10 mM linear range. Baseline current, electrode area and milk-matrix effects aren&apos;t in the research, so absolute currents on a real device will differ. Note that 11.6 mM sits just outside the reported linear range.
      </p>
      <div className="mt-2">
        <EvidenceBadge type="concept" long />
      </div>
    </div>
  );
}
