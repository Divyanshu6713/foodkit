"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { EvidenceBadge, SimulatedBanner } from "@/components/ui/EvidenceBadge";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { JOURNEY_STOPS, stopIndex, transitionAt } from "./stops";

const JourneyScene = dynamic(() => import("./JourneyScene"), { ssr: false, loading: () => <CanvasFallback /> });

export function Journey() {
  const wrap = useRef<HTMLDivElement>(null);
  const canvasBox = useRef<HTMLDivElement>(null);
  const progress = useRef(0);
  const [idx, setIdx] = useState(0);
  const [p, setP] = useState(0);
  const { scrollYProgress } = useScroll({ target: wrap, offset: ["start start", "end end"] });

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    progress.current = v;
    setP(v);
    const i = stopIndex(v);
    if (i !== idx) setIdx(i);
    // depth-of-field feel: blur while the zoom is travelling between scales
    const b = transitionAt(v) * 6;
    if (canvasBox.current) canvasBox.current.style.filter = b > 0.2 ? `blur(${b.toFixed(1)}px)` : "none";
  });

  const stop = JOURNEY_STOPS[idx];

  return (
    <section id="journey" ref={wrap} className="relative h-[900vh] scroll-mt-16">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_50%,#0c1f22,#05080b_70%)]" />
        <LazyMount className="absolute inset-0" margin="400px">
          <div ref={canvasBox} className="absolute inset-0 transition-[filter] duration-100">
            <JourneyScene progress={progress} />
          </div>
        </LazyMount>

        {/* scale ruler */}
        <div className="pointer-events-none absolute top-1/2 left-4 hidden -translate-y-1/2 flex-col gap-3 md:flex lg:left-8">
          {JOURNEY_STOPS.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3">
              <span className={`h-px transition-all duration-500 ${i === idx ? "w-10 bg-nano" : "w-4 bg-line-2"}`} />
              <span className={`mono text-[10px] tracking-widest uppercase transition-colors ${i === idx ? "text-nano" : "text-muted"}`}>{s.title}</span>
            </div>
          ))}
        </div>

        {/* stop copy */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-4 pb-10 sm:px-6 md:bottom-auto md:top-1/2 md:right-8 md:left-auto md:w-[420px] md:-translate-y-1/2 md:px-0 md:pb-0 lg:right-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={stop.key}
              initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -20, filter: "blur(6px)" }}
              transition={{ duration: 0.45 }}
              className="glass rounded-2xl p-5 sm:p-6"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <span className="eyebrow">
                  {String(idx + 1).padStart(2, "0")} / {JOURNEY_STOPS.length} · {stop.scale}
                </span>
                <EvidenceBadge type={stop.evidence} />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight sm:text-3xl">{stop.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-text-2 sm:text-base">{stop.text}</p>
              {stop.key === "signal" && <Spectrum />}
              {stop.key === "data" && <RgbData />}
              {stop.key === "result" && <MiniResult />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* header + progress */}
        <div className="pointer-events-none absolute inset-x-0 top-20 px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl items-start justify-between gap-4">
            <div>
              <div className="eyebrow">04 · Scroll journey</div>
              <h2 className="mt-2 text-xl font-semibold tracking-tight sm:text-2xl">From food to molecule to result</h2>
            </div>
            <span className="mono hidden text-xs text-muted sm:block">Not to scale · conceptual</span>
          </div>
          <div className="mx-auto mt-4 h-px max-w-7xl bg-line">
            <div className="h-px bg-nano" style={{ width: `${(p * 100).toFixed(2)}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Illustrative AgNP extinction spectrum: dispersed (~420 nm) vs aggregated. */
function Spectrum() {
  const W = 360;
  const H = 130;
  const g = (x: number, mu: number, s: number) => Math.exp(-((x - mu) ** 2) / (2 * s * s));
  const xs = Array.from({ length: 81 }, (_, i) => 350 + i * 5);
  const X = (nm: number) => 30 + ((nm - 350) / 400) * (W - 40);
  const Y = (v: number) => H - 22 - v * (H - 34);
  const line = (f: (x: number) => number) => xs.map((x, i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(f(x)).toFixed(1)}`).join(" ");
  return (
    <figure className="mt-4">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Illustrative extinction spectra: dispersed AgNPs peak near 420 nm; aggregated AgNPs show a lower, broader, red-shifted band.">
        <line x1={30} x2={W - 10} y1={H - 22} y2={H - 22} stroke="var(--line-2)" />
        {[400, 500, 600, 700].map((nm) => (
          <text key={nm} x={X(nm)} y={H - 8} fontSize="9" textAnchor="middle" fill="var(--muted)" className="mono">
            {nm}
          </text>
        ))}
        <path d={line((x) => g(x, 420, 28))} fill="none" stroke="var(--series-1)" strokeWidth="2" />
        <path d={line((x) => 0.55 * g(x, 430, 40) + 0.35 * g(x, 580, 80))} fill="none" stroke="var(--series-2)" strokeWidth="2" />
        <text x={X(420) + 8} y={Y(1) + 8} fontSize="10" fill="var(--text)">dispersed · ~420 nm</text>
        <text x={X(600)} y={Y(0.45)} fontSize="10" fill="var(--text)">aggregated</text>
      </svg>
      <figcaption className="text-[11px] text-muted">Wavelength (nm) vs extinction. Only the ~420 nm peak comes from the research; the curve shapes are illustrative.</figcaption>
    </figure>
  );
}

function RgbData() {
  const rows = [
    { z: "Urea zone", r: 118, g: 128, b: 160 },
    { z: "Control", r: 221, g: 214, b: 196 },
    { z: "Reference white", r: 247, g: 246, b: 242 },
  ];
  return (
    <div className="mt-4 space-y-2">
      {rows.map((r) => (
        <div key={r.z} className="grid grid-cols-[92px_1fr] items-center gap-3 text-[11px]">
          <span className="text-text-2">{r.z}</span>
          <div className="flex items-center gap-2">
            <span className="h-4 w-4 rounded border border-line-2" style={{ background: `rgb(${r.r},${r.g},${r.b})` }} />
            <span className="mono text-text">
              R {r.r} · G {r.g} · B {r.b}
            </span>
          </div>
        </div>
      ))}
      <p className="text-[11px] text-warn">Illustrative values — not measured.</p>
    </div>
  );
}

function MiniResult() {
  return (
    <div className="mt-4 space-y-2">
      <SimulatedBanner />
      <div className="flex items-baseline justify-between rounded-xl border border-line bg-bg/40 p-3">
        <span className="text-sm">Urea</span>
        <span className="text-sm font-semibold text-bad">Above 11.6 mM reference limit</span>
      </div>
    </div>
  );
}
