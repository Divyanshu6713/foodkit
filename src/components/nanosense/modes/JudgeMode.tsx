"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Clock, Pause, Play, X } from "lucide-react";
import { ASSAY, FINAL_STATEMENT, JUDGE, JUDGE_SECONDS, PROBLEM_STAT } from "@/content/nanosense";
import { useOverlay } from "../nav";
import { useDerived, useNS } from "../store";
import { ResultStates, SimLabel, Tag } from "../ui";
import { NanoCanvas } from "../viz/NanoCanvas";
import { useNanoColours } from "../views/NanoMechanism";
import { useFutureHardware } from "../views/Esp32";
import { SummaryList } from "../views/Summary";
import { CalibrationView, FeatureView, ResultView, SamplePhotos, UnknownPhoto } from "./visuals";

const SLIDE_MS = JUDGE_SECONDS * 1000;

export function JudgeMode() {
  const close = useOverlay((s) => s.close);
  const [{ idx, elapsed }, setClock] = useState({ idx: 0, elapsed: 0 });
  const [playing, setPlaying] = useState(true);
  const slide = JUDGE[idx];
  const last = idx === JUDGE.length - 1;
  const finished = last && elapsed >= SLIDE_MS;

  const goTo = (i: number) => setClock({ idx: Math.max(0, Math.min(JUDGE.length - 1, i)), elapsed: 0 });

  // Advance the clock; move to the next slide when this one's time is up.
  useEffect(() => {
    if (!playing || finished) return;
    const iv = setInterval(
      () =>
        setClock((c) => {
          const e = c.elapsed + 100;
          if (e < SLIDE_MS) return { ...c, elapsed: e };
          return c.idx === JUDGE.length - 1 ? { ...c, elapsed: SLIDE_MS } : { idx: c.idx + 1, elapsed: 0 };
        }),
      100,
    );
    return () => clearInterval(iv);
  }, [playing, finished]);

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") setClock((c) => ({ idx: Math.min(JUDGE.length - 1, c.idx + 1), elapsed: 0 }));
      else if (e.key === "ArrowLeft") setClock((c) => ({ idx: Math.max(0, c.idx - 1), elapsed: 0 }));
      else if (e.key === " ") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [close]);

  const remaining = Math.max(0, (JUDGE.length - idx) * SLIDE_MS - elapsed) / 1000;
  const mmss = `${Math.floor(remaining / 60)}:${String(Math.floor(remaining % 60)).padStart(2, "0")}`;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ns-bg"
      role="dialog"
      aria-modal="true"
      aria-label="Judge Mode presentation"
    >
      {/* Progress */}
      <div className="flex gap-1 px-4 pt-3 sm:px-6">
        {JUDGE.map((s, i) => (
          <button key={s.id} type="button" onClick={() => goTo(i)} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ns-line2" aria-label={`Slide ${i + 1}: ${s.title}`}>
            <span className="block h-full bg-ns-blue" style={{ width: i < idx ? "100%" : i === idx ? `${(elapsed / SLIDE_MS) * 100}%` : "0%" }} />
          </button>
        ))}
      </div>
      <header className="flex items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="ns-eyebrow">Judge Mode</span>
          <ModeTag />
          <span className="mono inline-flex items-center gap-1 text-[11.5px] text-ns-muted">
            <Clock className="h-3.5 w-3.5" /> {mmss} left
          </span>
        </div>
        <button type="button" onClick={close} className="rounded-full p-2 text-ns-text2 hover:bg-ns-surface2" aria-label="Exit Judge Mode (Esc)">
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 items-center px-4 pb-6 sm:px-6">
        <AnimatePresence mode="wait">
          <motion.section
            key={slide.id}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.35 }}
            className="grid w-full items-center gap-8 lg:grid-cols-[1fr_1.1fr]"
          >
            <div>
              <div className="flex items-center gap-3">
                <span className="mono text-5xl font-semibold text-ns-line2">{String(idx + 1).padStart(2, "0")}</span>
                {slide.category && <Tag c={slide.category} long />}
              </div>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">{slide.title}</h2>
              <p className="mt-4 text-xl leading-snug text-ns-text2">{slide.lead}</p>
              <ul className="mt-6 space-y-2.5">
                {slide.points.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 + i * 0.35 }}
                    className="flex items-center gap-3 text-[17px]"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-ns-blue" /> {p}
                  </motion.li>
                ))}
              </ul>
            </div>
            <div className="ns-card grid min-h-[320px] place-items-center overflow-hidden p-5">
              <SlideVisual id={slide.id} elapsed={elapsed} />
            </div>
          </motion.section>
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-center gap-2 border-t border-ns-line px-4 py-3">
        <button type="button" onClick={() => goTo(idx - 1)} disabled={idx === 0} className="rounded-full p-2.5 text-ns-text2 hover:bg-ns-surface2 disabled:opacity-30" aria-label="Previous slide">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={() => {
            if (finished) {
              goTo(0);
              setPlaying(true);
            } else setPlaying((p) => !p);
          }}
          className="inline-flex items-center gap-2 rounded-full bg-ns-blue px-5 py-2 text-sm font-medium text-white"
        >
          {playing && !finished ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {finished ? "Restart" : playing ? "Pause" : "Resume"}
        </button>
        <button type="button" onClick={() => goTo(idx + 1)} disabled={last} className="rounded-full p-2.5 text-ns-text2 hover:bg-ns-surface2 disabled:opacity-30" aria-label="Next slide">
          <ChevronRight className="h-5 w-5" />
        </button>
        <span className="mono ml-3 hidden text-[11px] text-ns-muted sm:inline">Space · ← → · Esc</span>
      </footer>
    </motion.div>
  );
}

function SlideVisual({ id, elapsed }: { id: string; elapsed: number }) {
  const { all } = useDerived();
  const nano = useNanoColours();
  const hw = useFutureHardware();
  switch (id) {
    case "problem":
      return (
        <div className="text-center">
          <div className="mono text-4xl font-semibold sm:text-5xl">{PROBLEM_STAT.value}</div>
          <div className="mt-2 text-lg text-ns-text2">{PROBLEM_STAT.label}</div>
          <div className="mt-3 text-[11.5px] text-ns-muted">{PROBLEM_STAT.source}</div>
        </div>
      );
    case "physical":
      return <SamplePhotos />;
    case "nano":
      return (
        <div className="h-[300px] w-full">
          <NanoCanvas phase={Math.min(5, Math.floor(elapsed / 2600))} {...nano} />
        </div>
      );
    case "optical":
      return <UnknownPhoto />;
    case "digital":
      return <FeatureView />;
    case "calibration":
      return <CalibrationView />;
    case "result":
      return (
        <div className="w-full">
          <ResultView />
          <div className="mt-5">
            <ResultStates state={all.unknown.state} compact />
          </div>
        </div>
      );
    case "esp32":
      return (
        <div className="mono grid w-full max-w-md gap-2 text-[14px]">
          {[
            ["Optical sensor", `${hw.rd.volts.toFixed(3)} V`],
            ["ESP32 ADC", `${hw.rd.counts} / ${2 ** ASSAY.adcBits - 1}`],
            ["Processed", `${hw.processed.toFixed(3)} AU`],
            ["Calibration", "needs experimental data"],
          ].map(([k, v], i) => (
            <motion.div
              key={k}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.5 }}
              className="flex justify-between rounded-lg border border-ns-line bg-ns-surface2 px-4 py-3"
            >
              <span className="text-ns-muted">{k}</span>
              <span className="font-semibold">{v}</span>
            </motion.div>
          ))}
          <SimLabel className="mt-2 justify-center">Future Hardware — Simulated · not connected</SimLabel>
        </div>
      );
    default:
      return (
        <div className="w-full">
          <SummaryList />
          <p className="mt-3 text-[13px] leading-relaxed font-medium">{FINAL_STATEMENT}</p>
        </div>
      );
  }
}

function ModeTag() {
  const mode = useNS((s) => s.mode);
  return (
    <span
      className={`mono rounded-md border-2 px-2 py-0.5 text-[10.5px] font-bold tracking-[0.12em] uppercase ${
        mode === "real" ? "border-ns-green text-ns-green" : "border-ns-amber text-ns-amber"
      }`}
    >
      {mode === "real" ? "Real Experiment" : "Simulation"}
    </span>
  );
}
