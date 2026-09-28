"use client";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Pause, Play } from "lucide-react";
import { FLOW } from "@/content/nanosense";
import { go } from "../nav";
import { Btn, CAT_BG, Card, StepHeader, Tag } from "../ui";

export function SystemFlow() {
  const [at, setAt] = useState(0);
  const [auto, setAuto] = useState(true);

  useEffect(() => {
    if (!auto) return;
    const t = setTimeout(() => setAt((a) => (a + 1) % FLOW.length), 1700);
    return () => clearTimeout(t);
  }, [auto, at]);

  const s = FLOW[at];
  return (
    <>
      <StepHeader n={12} title="Complete System Flow" category="digital" lead="A laboratory sample moving through the complete proposed system. Click any step for a short explanation." />
      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <Card className="p-4 sm:p-5">
          <ol className="relative grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {FLOW.map((f, i) => {
              const on = i === at;
              return (
                <li key={f.title}>
                  <button
                    type="button"
                    onClick={() => {
                      setAuto(false);
                      setAt(i);
                    }}
                    aria-pressed={on}
                    className={`relative flex w-full items-center gap-3 overflow-hidden rounded-xl border px-3 py-3 text-left transition-all ${
                      on ? "border-ns-blue bg-ns-blue/[0.08] shadow-[0_0_0_3px_color-mix(in_oklab,var(--ns-blue)_14%,transparent)]" : i < at ? "border-ns-line2 bg-ns-surface" : "border-ns-line bg-ns-surface"
                    }`}
                  >
                    <span className={`absolute inset-y-0 left-0 w-1 ${CAT_BG[f.category]}`} />
                    <span className={`mono grid h-8 w-8 shrink-0 place-items-center rounded-full text-[12px] font-bold ${on ? "bg-ns-blue text-white" : "bg-ns-surface2 text-ns-text2"}`}>
                      {i + 1}
                    </span>
                    <span className="min-w-0">
                      <span className="mono block text-[9.5px] tracking-[0.14em] text-ns-muted uppercase">Step {i + 1}</span>
                      <span className="block text-[13px] leading-tight font-semibold">{f.title}</span>
                    </span>
                    {on && (
                      <motion.span layoutId="ns-sample-dot" className="ml-auto h-3.5 w-3.5 shrink-0 rounded-full bg-ns-s3 shadow-[0_0_12px_var(--ns-s3)]" transition={{ type: "spring", stiffness: 260, damping: 26 }} />
                    )}
                  </button>
                </li>
              );
            })}
          </ol>
          <div className="mt-4 flex items-center gap-3 text-[11.5px] text-ns-muted">
            <button
              type="button"
              onClick={() => setAuto((a) => !a)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ns-line2 px-3 py-1 text-ns-text2 hover:text-ns-text"
            >
              {auto ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {auto ? "Pause sample" : "Animate sample"}
            </button>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-ns-s3" /> the sample
            </span>
          </div>
        </Card>

        <div className="lg:sticky lg:top-40 lg:self-start">
          <AnimatePresence mode="wait">
            <motion.div key={at} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }}>
              <Card className="p-6">
                <div className="ns-eyebrow">Step {at + 1} of {FLOW.length}</div>
                <h2 className="mt-1 text-xl font-semibold">{s.title}</h2>
                <div className="mt-2">
                  <Tag c={s.category} long />
                </div>
                <p className="mt-4 text-[14.5px] leading-relaxed text-ns-text2">{s.text}</p>
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-ns-line">
                  <div className="h-full rounded-full bg-ns-blue transition-all duration-500" style={{ width: `${((at + 1) / FLOW.length) * 100}%` }} />
                </div>
              </Card>
            </motion.div>
          </AnimatePresence>
          <Btn onClick={() => go("report")} icon className="mt-4">
            Generate the digital report
          </Btn>
        </div>
      </div>
    </>
  );
}
