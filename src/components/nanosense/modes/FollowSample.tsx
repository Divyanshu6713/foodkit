"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Atom, Camera, ChartScatter, ChevronLeft, ChevronRight, Cpu, FileCheck, FlaskConical, Milk, Pause, Play, ScanLine, TestTube as TubeIcon, X } from "lucide-react";
import { ASSAY, FOLLOW } from "@/content/nanosense";
import { useOverlay } from "../nav";
import { useNS } from "../store";
import { CAT_TEXT, SimLabel, Tag } from "../ui";
import { NanoCanvas } from "../viz/NanoCanvas";
import { TestTube } from "../viz/TestTube";
import { useNanoColours } from "../views/NanoMechanism";
import { CalibrationView, FeatureView, IllustrativeTubes, ResultView, UnknownPhoto } from "./visuals";

const ICONS = [Milk, TubeIcon, FlaskConical, Atom, Camera, ScanLine, Activity, ChartScatter, FileCheck, Cpu];
const DWELL = 6500;

export function FollowSample() {
  const close = useOverlay((s) => s.close);
  const [at, setAt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const st = FOLLOW[at];

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => {
      if (at < FOLLOW.length - 1) setAt(at + 1);
      else setPlaying(false);
    }, DWELL);
    return () => clearTimeout(t);
  }, [playing, at]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") setAt((a) => Math.min(FOLLOW.length - 1, a + 1));
      if (e.key === "ArrowLeft") setAt((a) => Math.max(0, a - 1));
      if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [close]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ns-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Follow the Sample"
    >
      <div className="ns-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
      <header className="relative flex items-center justify-between border-b border-ns-line px-4 py-3 sm:px-6">
        <div>
          <div className="ns-eyebrow">Interactive mode</div>
          <h2 className="text-lg font-semibold">Follow the Sample</h2>
          <ModeLine />
        </div>
        <button type="button" onClick={close} className="rounded-full p-2 text-ns-text2 hover:bg-ns-surface2" aria-label="Close (Esc)">
          <X className="h-5 w-5" />
        </button>
      </header>

      {/* Track */}
      <div className="relative overflow-x-auto px-4 pt-6 sm:px-6">
        <div className="relative mx-auto min-w-[720px] max-w-6xl pb-2">
          <div className="absolute top-6 right-[5%] left-[5%] h-0.5 bg-ns-line2" />
          <div className="absolute top-6 left-[5%] h-0.5 bg-ns-blue transition-all duration-700" style={{ width: `${(at / (FOLLOW.length - 1)) * 90}%` }} />
          <ol className="relative grid grid-cols-10">
            {FOLLOW.map((f, i) => {
              const Icon = ICONS[i];
              return (
                <li key={f.id} className="flex flex-col items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setPlaying(false);
                      setAt(i);
                    }}
                    className={`relative grid h-12 w-12 place-items-center rounded-full border-2 bg-ns-surface transition-all ${
                      i === at ? "scale-110 border-ns-blue text-ns-blue" : i < at ? "border-ns-blue/50 text-ns-blue" : "border-ns-line2 text-ns-muted"
                    }`}
                    aria-label={`Stage ${i + 1}: ${f.label}`}
                    aria-current={i === at ? "step" : undefined}
                  >
                    <Icon className="h-5 w-5" />
                    {i === at && (
                      <motion.span layoutId="ns-follow-token" className="absolute -top-2.5 -right-1.5 h-4 w-4 rounded-full border-2 border-ns-surface bg-ns-s3 shadow-[0_0_14px_var(--ns-s3)]" />
                    )}
                  </button>
                  <span className={`mt-2 text-center text-[11px] leading-tight ${i === at ? "font-semibold text-ns-text" : "text-ns-muted"}`}>{f.label}</span>
                  <span className={`mt-1 h-1.5 w-1.5 rounded-full ${f.category === "physical" ? "bg-ns-green" : f.category === "concept" ? "bg-ns-violet" : "bg-ns-amber"}`} />
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      {/* Stage */}
      <div className="relative mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={st.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3 }}
            className="grid gap-5 lg:grid-cols-[1fr_1.1fr]"
          >
            <div className="ns-card grid min-h-[300px] place-items-center overflow-hidden p-4">
              <StageVisual id={st.id} />
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="mono text-[12px] text-ns-muted">
                  Stage {at + 1} / {FOLLOW.length}
                </span>
                <Tag c={st.category} long />
              </div>
              <h3 className="text-2xl font-semibold tracking-tight">{st.label}</h3>
              <QA q="What is happening?" a={st.happening} />
              <QA q="What is measured?" a={st.measured} />
              <QA q="What is simulated?" a={st.simulated} tone={st.category === "physical" ? "text-ns-green" : CAT_TEXT[st.category]} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="relative flex items-center justify-center gap-2 border-t border-ns-line px-4 py-3">
        <button type="button" onClick={() => setAt((a) => Math.max(0, a - 1))} disabled={at === 0} className="rounded-full p-2.5 text-ns-text2 hover:bg-ns-surface2 disabled:opacity-30" aria-label="Previous stage">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (!playing && at === FOLLOW.length - 1) setAt(0);
            setPlaying((p) => !p);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ns-blue px-5 py-2 text-sm font-medium text-white"
        >
          {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {playing ? "Pause" : at === FOLLOW.length - 1 ? "Restart" : "Play"}
        </button>
        <button
          type="button"
          onClick={() => setAt((a) => Math.min(FOLLOW.length - 1, a + 1))}
          disabled={at === FOLLOW.length - 1}
          className="rounded-full p-2.5 text-ns-text2 hover:bg-ns-surface2 disabled:opacity-30"
          aria-label="Next stage"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>
    </motion.div>
  );
}

function QA({ q, a, tone = "text-ns-blue" }: { q: string; a: string; tone?: string }) {
  return (
    <div className="ns-card p-4">
      <div className={`mono text-[11px] font-semibold tracking-[0.12em] uppercase ${tone}`}>{q}</div>
      <p className="mt-1 text-[15px] leading-relaxed">{a}</p>
    </div>
  );
}

function ModeLine() {
  const mode = useNS((s) => s.mode);
  return (
    <span className={`mono text-[10.5px] font-semibold tracking-wider uppercase ${mode === "real" ? "text-ns-green" : "text-ns-amber"}`}>
      {mode === "real" ? "Real experiment data" : "Simulation — illustrative data"}
    </span>
  );
}

function StageVisual({ id }: { id: string }) {
  const nano = useNanoColours();
  switch (id) {
    case "milk":
      return <TestTube colour={ASSAY.colours.control} level={0.5} className="h-56 w-auto" label="milk sample" />;
    case "tube":
      return <TestTube colour={ASSAY.colours.control} level={0.62} bubbles className="h-60 w-auto" label="prepared sample" />;
    case "reaction":
      return <IllustrativeTubes ts={[0, 0.7]} labels={["Control", "Sample"]} />;
    case "nano":
      return (
        <div className="h-[300px] w-full">
          <NanoCanvas phase={5} {...nano} />
        </div>
      );
    case "photo":
    case "roi":
      return <UnknownPhoto />;
    case "feature":
      return <FeatureView />;
    case "graph":
      return <CalibrationView />;
    case "result":
      return <ResultView />;
    default:
      return (
        <div className="text-center">
          <Cpu className="mx-auto h-14 w-14 text-ns-amber" />
          <div className="mt-3 text-[15px] font-semibold">Optical sensor → ESP32 ADC → digital value</div>
          <SimLabel className="mt-3">Future Hardware — Simulated</SimLabel>
          <p className="mt-2 text-[12.5px] text-ns-text2">Not connected to the physical test.</p>
        </div>
      );
  }
}
