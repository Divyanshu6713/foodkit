"use client";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { FlaskRound } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button, Chip } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CHEMS, colorAt, estimate, fmt, rgbAt } from "@/lib/colorimetry";
import { mixHex } from "@/lib/color";

const CH = [
  { k: "R", color: "#ff6b6b" },
  { k: "G", color: "#5be38a" },
  { k: "B", color: "#6aa8ff" },
];

export function Colorimetry() {
  const [ci, setCi] = useState(0);
  const chem = CHEMS[ci];
  const [c, setC] = useState(chem.rangeMax * 0.6);
  const [react, setReact] = useState(1); // 0 = neutral strip, 1 = fully reacted
  const [noise, setNoise] = useState(true);

  const pickChem = (i: number) => {
    setCi(i);
    setC(+(CHEMS[i].rangeMax * 0.6).toFixed(2));
  };

  const neutral = useMemo(() => colorAt(chem, 0), [chem]);
  const final = colorAt(chem, c);
  const shown = mixHex(neutral, final, react);
  const rgb = useMemo(() => {
    const base = rgbAt(chem, c);
    if (!noise) return base;
    // deterministic pseudo camera noise (±3 counts)
    return base.map((v, i) => Math.round(v + Math.sin(c * 13.7 + i * 2.1) * 3)) as [number, number, number];
  }, [chem, c, noise]);
  const est = estimate(chem, rgb);
  const above = c >= chem.threshold;

  const runReaction = () => {
    setReact(0);
    const t0 = performance.now();
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 2200);
      setReact(k);
      if (k < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };

  return (
    <Section id="colorimetry" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="11"
          eyebrow="Interactive colorimetry"
          title="Move the concentration and watch the color follow"
          lead="A color change only becomes a number after it's measured against a calibration curve. Drag the slider to change the simulated concentration, then see the strip color, the RGB values a camera would extract, and the concentration recovered from them."
          aside={<EvidenceBadge type="sim" long />}
        />

        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Chemistry">
          {CHEMS.map((ch, i) => (
            <Chip key={ch.target} active={ci === i} onClick={() => pickChem(i)}>
              {ch.name} · <span className="text-muted">{ch.reagent}</span>
            </Chip>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* strip + controls */}
          <div className="rounded-3xl border border-line-2 bg-surface/60 p-6">
            <div className="flex items-start gap-6">
              <div className="relative h-72 w-20 shrink-0 rounded-lg bg-[#26303c] p-2 shadow-inner">
                <div className="absolute inset-x-[34px] top-6 bottom-10 rounded-full bg-[#f4f2eb]" />
                <div className="absolute top-8 left-1/2 h-14 w-14 -translate-x-1/2 rounded-full border-2 border-[#f4f2eb]" style={{ background: shown, transition: "background .15s" }} />
                {/* camera ROI */}
                <motion.div
                  className="absolute top-6 left-1/2 h-[72px] w-[72px] -translate-x-1/2 rounded-md border-2 border-dashed border-nano"
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                />
                <div className="absolute bottom-3 left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-[#dcd6c4]" />
                <div className="absolute inset-x-2 bottom-[-18px] flex gap-0.5">
                  {["#fff", "#bdbdbd", "#6e6e6e", "#1d1d1d"].map((r) => (
                    <span key={r} className="h-2 flex-1" style={{ background: r }} />
                  ))}
                </div>
              </div>
              <div className="flex-1 space-y-3 pt-2">
                <div className="mono text-[10px] tracking-widest text-muted uppercase">Camera ROI · RGB</div>
                {CH.map((ch, i) => (
                  <div key={ch.k}>
                    <div className="mono flex justify-between text-xs">
                      <span style={{ color: ch.color }}>{ch.k}</span>
                      <span>{Math.round(rgb[i] * react + (rgbAt(chem, 0)[i] * (1 - react)))}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-line">
                      <div className="h-1.5 rounded-full" style={{ width: `${((rgb[i] * react + rgbAt(chem, 0)[i] * (1 - react)) / 255) * 100}%`, background: ch.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10">
              <label htmlFor="conc" className="flex items-baseline justify-between text-sm">
                <span className="text-text-2">Sample concentration</span>
                <span className="mono text-lg text-text">{fmt(c, chem.unit)}</span>
              </label>
              <input
                id="conc"
                type="range"
                className="range mt-3"
                min={0}
                max={chem.max}
                step={chem.max / 200}
                value={c}
                onChange={(e) => setC(+e.target.value)}
              />
              <div className="mono mt-1 flex justify-between text-[10px] text-muted">
                <span>0</span>
                <span>
                  stated range {chem.rangeMin}–{chem.rangeMax} {chem.unit}
                </span>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button variant="ghost" onClick={runReaction}>
                <FlaskRound className="h-4 w-4" /> Add sample to fresh strip
              </Button>
              <label className="flex items-center gap-2 text-xs text-text-2">
                <input type="checkbox" checked={noise} onChange={(e) => setNoise(e.target.checked)} className="accent-[var(--nano)]" />
                camera noise
              </label>
            </div>

            <div className="mt-6 rounded-xl border border-line bg-bg/40 p-4">
              <div className="mono text-[10px] tracking-widest text-muted uppercase">Concentration estimate (from RGB)</div>
              <div className="mt-1 text-2xl font-semibold">{fmt(est, chem.unit)}</div>
              <div className={`mt-1 text-xs ${above ? "text-bad" : "text-good"}`}>
                {chem.thresholdKind === "limit"
                  ? above
                    ? `Above ${chem.thresholdLabel} (${chem.threshold} ${chem.unit})`
                    : `Below ${chem.thresholdLabel} (${chem.threshold} ${chem.unit})`
                  : above
                    ? `Above ${chem.thresholdLabel} (${chem.threshold} ${chem.unit}) — would screen positive`
                    : `Below ${chem.thresholdLabel} (${chem.threshold} ${chem.unit})`}
              </div>
            </div>
          </div>

          {/* chart */}
          <div className="rounded-3xl border border-line-2 bg-surface/60 p-6">
            <RgbChart chemIndex={ci} c={c} />
          </div>
        </div>
      </Container>
    </Section>
  );
}

function RgbChart({ chemIndex, c }: { chemIndex: number; c: number }) {
  const chem = CHEMS[chemIndex];
  const W = 640;
  const H = 360;
  const pad = { l: 46, r: 30, t: 20, b: 44 };
  const iw = W - pad.l - pad.r;
  const ih = H - pad.t - pad.b;
  const N = 80;
  const xs = Array.from({ length: N + 1 }, (_, i) => (i / N) * chem.max);
  const X = (v: number) => pad.l + (v / chem.max) * iw;
  const Y = (v: number) => pad.t + ih - (v / 255) * ih;
  const [hover, setHover] = useState<number | null>(null);
  const lines = CH.map((ch, k) => xs.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(rgbAt(chem, x)[k]).toFixed(1)}`).join(" "));
  const cur = rgbAt(chem, c);
  const hv = hover !== null ? xs[hover] : null;
  const hrgb = hv !== null ? rgbAt(chem, hv) : null;

  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <figcaption className="text-sm font-medium">RGB intensity vs concentration — {chem.name}</figcaption>
        <div className="flex items-center gap-3 text-xs text-text-2">
          {CH.map((ch) => (
            <span key={ch.k} className="flex items-center gap-1.5">
              <span className="h-0.5 w-4" style={{ background: ch.color }} /> {ch.k}
            </span>
          ))}
        </div>
      </div>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Illustrative RGB response curves for ${chem.name}. Current concentration ${fmt(c, chem.unit)} gives R ${cur[0]}, G ${cur[1]}, B ${cur[2]}.`}
        onMouseMove={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const x = ((e.clientX - r.left) / r.width) * W;
          const i = Math.round(((x - pad.l) / iw) * N);
          setHover(i >= 0 && i <= N ? i : null);
        }}
        onMouseLeave={() => setHover(null)}
      >
        {[0, 64, 128, 192, 255].map((g) => (
          <g key={g}>
            <line x1={pad.l} x2={W - pad.r} y1={Y(g)} y2={Y(g)} stroke="var(--line)" />
            <text x={pad.l - 8} y={Y(g) + 4} textAnchor="end" fontSize="10" fill="var(--muted)" className="mono">
              {g}
            </text>
          </g>
        ))}
        {[0, 0.25, 0.5, 0.75, 1].map((f) => (
          <text key={f} x={X(f * chem.max)} y={H - pad.b + 18} textAnchor="middle" fontSize="10" fill="var(--muted)" className="mono">
            {+(f * chem.max).toFixed(2)}
          </text>
        ))}
        <text x={pad.l + iw / 2} y={H - 6} textAnchor="middle" fontSize="11" fill="var(--text-2)">
          Concentration ({chem.unit})
        </text>
        {/* stated range band */}
        <rect x={X(chem.rangeMin)} y={pad.t} width={X(chem.rangeMax) - X(chem.rangeMin)} height={ih} fill="var(--nano)" opacity="0.05" />
        {/* threshold */}
        <line x1={X(chem.threshold)} x2={X(chem.threshold)} y1={pad.t} y2={pad.t + ih} stroke="var(--warn)" strokeDasharray="4 4" />
        <text x={X(chem.threshold) + 5} y={pad.t + 12} fontSize="10" fill="var(--warn)">
          {chem.thresholdLabel} {chem.threshold}
        </text>
        {lines.map((d, k) => (
          <path key={k} d={d} fill="none" stroke={CH[k].color} strokeWidth="2" />
        ))}
        {/* direct labels */}
        {CH.map((ch, k) => (
          <text key={ch.k} x={W - pad.r + 6} y={Y(rgbAt(chem, chem.max)[k]) + 4} fontSize="11" fill="var(--text-2)" className="mono">
            {ch.k}
          </text>
        ))}
        {/* current value */}
        <line x1={X(c)} x2={X(c)} y1={pad.t} y2={pad.t + ih} stroke="var(--text)" strokeOpacity="0.5" />
        {cur.map((v, k) => (
          <circle key={k} cx={X(c)} cy={Y(v)} r="5" fill={CH[k].color} stroke="var(--surface)" strokeWidth="2" />
        ))}
        {hv !== null && hrgb && (
          <g>
            <line x1={X(hv)} x2={X(hv)} y1={pad.t} y2={pad.t + ih} stroke="var(--line-2)" />
            <rect x={Math.min(X(hv) + 8, W - 150)} y={pad.t + 20} width="140" height="62" rx="6" fill="var(--bg)" stroke="var(--line-2)" />
            <text x={Math.min(X(hv) + 16, W - 142)} y={pad.t + 38} fontSize="11" fill="var(--text)" className="mono">
              {fmt(hv, chem.unit)}
            </text>
            <text x={Math.min(X(hv) + 16, W - 142)} y={pad.t + 56} fontSize="10" fill="var(--text-2)" className="mono">
              R {hrgb[0]} G {hrgb[1]} B {hrgb[2]}
            </text>
            <rect x={Math.min(X(hv) + 16, W - 142)} y={pad.t + 64} width="30" height="10" rx="2" fill={colorAt(chem, hv)} />
          </g>
        )}
      </svg>
      <p className="mt-2 text-xs text-text-2">
        Shaded band: stated detection range from the research. Start and end colors follow the named chemistry; the curve shape is a generic saturating model, not experimental data.
      </p>
    </figure>
  );
}
