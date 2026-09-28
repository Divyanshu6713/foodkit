"use client";
import { useEffect, useState } from "react";
import { ArrowDown, Pause, Play, RotateCcw } from "lucide-react";
import { ASSAY, NANO_DISCLAIMER, NANO_EXPLAINER, NANO_STAGES } from "@/content/nanosense";
import { go } from "../nav";
import { Btn, Card, Note, StepHeader, Tag, Term } from "../ui";
import { NanoCanvas } from "../viz/NanoCanvas";

const LAST = NANO_STAGES.length;

/** Illustration colours. Always the configured assay colours: the animation is a concept, not a measurement. */
export function useNanoColours() {
  return {
    baseColour: ASSAY.nanoBase,
    responseColour: ASSAY.colours.positive,
    mediumBefore: ASSAY.colours.control,
    mediumAfter: ASSAY.colours.positive,
  };
}

export function NanoMechanism() {
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(false);
  const colours = useNanoColours();

  useEffect(() => {
    if (!playing || phase >= LAST) return;
    const t = setTimeout(
      () => {
        if (phase === LAST - 1) setPlaying(false);
        setPhase(phase + 1);
      },
      phase === 0 ? 700 : 2600,
    );
    return () => clearTimeout(t);
  }, [playing, phase]);

  const play = () => {
    if (phase >= LAST) setPhase(0);
    setPlaying(true);
  };
  const status = phase === 0 ? "Stable sensing layer" : phase === 1 ? "Target analyte entering" : phase === 2 ? "Target-specific interaction" : "Nano-sensing response";

  return (
    <>
      <StepHeader n={3} title="How Does the Nano-Sensing Layer Work?" category="concept" lead={NANO_EXPLAINER} />
      <div className="grid gap-5 lg:grid-cols-[1fr_19rem]">
        <div>
          <Card className="relative overflow-hidden">
            <div className="h-[340px] sm:h-[420px]">
              <NanoCanvas phase={phase} {...colours} />
            </div>
            <div className="absolute top-3 left-3 flex flex-wrap items-center gap-2">
              <Tag c="concept" />
              <span
                className={`mono rounded-md px-2 py-1 text-[11px] font-semibold tracking-wider uppercase backdrop-blur ${
                  phase >= 1 ? "bg-ns-blue/15 text-ns-blue" : "bg-ns-surface/80 text-ns-muted"
                }`}
                aria-live="polite"
              >
                {status}
              </span>
            </div>
            <div className="absolute right-3 bottom-3 left-3 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg bg-ns-surface/85 px-3 py-2 text-[11px] text-ns-text2 backdrop-blur">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-full" style={{ background: colours.baseColour }} /> <Term k="nanoparticle">Nanoparticle</Term>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rotate-45" style={{ background: "#e2692f" }} /> Target <Term k="analyte">analyte</Term> / reaction product
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-5 rounded bg-[#f6e6a8]" /> Probe light
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-3.5 rounded-sm bg-[#141c28]" /> Camera / optical sensor
              </span>
            </div>
          </Card>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Btn onClick={playing ? () => setPlaying(false) : play} className="px-4 py-2">
              {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {playing ? "Pause" : phase >= LAST ? "Replay" : "Introduce target analyte"}
            </Btn>
            {NANO_STAGES.map((st, i) => (
              <button
                key={st.title}
                type="button"
                onClick={() => {
                  setPlaying(false);
                  setPhase(i + 1);
                }}
                className={`mono h-9 w-9 rounded-full border text-[13px] font-semibold transition-colors ${
                  phase === i + 1 ? "border-ns-blue bg-ns-blue text-white" : phase > i + 1 ? "border-ns-blue/40 text-ns-blue" : "border-ns-line2 text-ns-text2"
                }`}
                aria-label={`Show stage ${i + 1}: ${st.title}`}
              >
                {i + 1}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setPlaying(false);
                setPhase(0);
              }}
              className="ml-1 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] text-ns-text2 hover:bg-ns-surface2"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </button>
          </div>
        </div>

        <ol className="flex flex-col">
          {NANO_STAGES.map((s, i) => {
            const on = phase === i + 1;
            const done = phase > i + 1;
            return (
              <li key={s.title} className="flex flex-col items-stretch">
                <div
                  className={`rounded-xl border p-3 transition-all duration-300 ${
                    on ? "border-ns-blue bg-ns-blue/[0.07] shadow-[0_0_0_3px_color-mix(in_oklab,var(--ns-blue)_12%,transparent)]" : "border-ns-line bg-ns-surface"
                  } ${!on && !done ? "opacity-70" : ""}`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${on || done ? "bg-ns-blue text-white" : "bg-ns-surface2 text-ns-muted"}`}>
                      {i + 1}
                    </span>
                    <span className="text-[13px] leading-tight font-semibold">{s.title}</span>
                  </div>
                  <p className="mt-1 pl-8 text-[12px] leading-relaxed text-ns-text2">{s.text}</p>
                </div>
                {i < NANO_STAGES.length - 1 && <ArrowDown className={`mx-auto my-0.5 h-3.5 w-3.5 ${done ? "text-ns-blue" : "text-ns-muted"}`} />}
              </li>
            );
          })}
        </ol>
      </div>
      <Note tone="warn" className="mt-5">
        <b>{NANO_DISCLAIMER}</b> This animation is a simplified illustration of a nano-sensing response and a target-specific interaction. It does not show a specific binding
        chemistry, particle size or colour mechanism.
      </Note>
      <div className="mt-5 flex flex-wrap gap-2">
        <Btn onClick={() => go("compare-nano")} icon>
          Compare before and after
        </Btn>
        <Btn variant="secondary" onClick={() => go("image")}>
          Go to photograph analysis
        </Btn>
      </div>
    </>
  );
}
