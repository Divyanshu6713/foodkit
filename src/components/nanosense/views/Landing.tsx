"use client";
import { Fragment } from "react";
import { motion } from "motion/react";
import { Activity, ArrowDown, BookOpen, Camera, ChartScatter, Eye, FlaskConical, Footprints, Gauge, Milk, Play, Presentation, ScanLine } from "lucide-react";
import { PIPELINE, STORY, TECH } from "@/content/nanosense";
import { go, useOverlay } from "../nav";
import { useNS } from "../store";
import { mix } from "../model";
import { ASSAY } from "@/content/nanosense";
import { Btn, CAT_TEXT, Tag } from "../ui";
import { ParticleField } from "../viz/ParticleField";
import { TestTube } from "../viz/TestTube";
import { StatusLists } from "./Status";

const ICONS = [Milk, FlaskConical, Eye, Camera, ScanLine, Activity, ChartScatter, Gauge];
const HERO = [
  { label: "Control", t: 0 },
  { label: "Reference", t: 1 },
  { label: "Unknown", t: 0.7 },
];

export function Landing() {
  const theme = useNS((s) => s.theme);
  const open = useOverlay((s) => s.open);
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-ns-line">
        <ParticleField dark={theme === "dark"} />
        <div className="ns-grid pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pt-14 pb-16 sm:px-6 lg:grid-cols-[1.25fr_1fr] lg:pt-20 lg:pb-24">
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <p className="ns-eyebrow mb-4">Drishya · Smart Nano-Based Food Adulteration Detection System</p>
            <h1 className="bg-gradient-to-r from-ns-blue via-ns-blue to-ns-green bg-clip-text text-6xl font-semibold tracking-tight text-transparent sm:text-7xl">
              NanoSense
            </h1>
            <p className="mt-4 max-w-xl text-balance text-xl leading-snug text-ns-text sm:text-2xl">From Physical Chemical Reaction to Digital Adulteration Detection</p>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-ns-text2">
              We perform the chemistry live. This app shows what happens next: how the visible response could become a measured, calibrated, digital result.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Btn onClick={() => go("setup")} className="px-6 py-3">
                <Play className="h-4 w-4" /> Start Demonstration
              </Btn>
              <Btn variant="secondary" onClick={() => go("how")} className="px-6 py-3">
                <BookOpen className="h-4 w-4" /> Understand the Technology
              </Btn>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px]">
              <button type="button" onClick={() => open("follow")} className="inline-flex items-center gap-1.5 text-ns-text2 hover:text-ns-blue">
                <Footprints className="h-4 w-4" /> Follow the Sample
              </button>
              <button type="button" onClick={() => open("judge")} className="inline-flex items-center gap-1.5 text-ns-text2 hover:text-ns-blue">
                <Presentation className="h-4 w-4" /> Judge Mode (≈ 2.5 min)
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="ns-glass rounded-2xl p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-medium">Demonstration at a glance</span>
              <Tag c="physical" />
            </div>
            <div className="mt-4 flex items-end justify-center gap-6">
              {HERO.map((h) => (
                <div key={h.label} className="text-center">
                  <TestTube colour={mix(ASSAY.colours.control, ASSAY.colours.positive, h.t)} className="mx-auto h-36 w-auto" bubbles={h.label === "Unknown"} label={h.label} />
                  <div className="mono mt-1 text-[10.5px] text-ns-muted">{h.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center text-[11.5px]">
              <div className="rounded-lg border border-ns-green/30 bg-ns-green/[0.07] px-2 py-2 text-ns-green">Physical test + photo · real</div>
              <div className="ns-wire w-8" aria-hidden />
              <div className="rounded-lg border border-ns-blue/30 bg-ns-blue/[0.07] px-2 py-2 text-ns-blue">ROI → feature → calibration</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="ns-eyebrow">The pipeline</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">From food sample to digital result</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag c="physical" long />
            <Tag c="digital" long />
          </div>
        </div>
        <ol className="grid gap-3 sm:grid-cols-4 lg:grid-cols-8 lg:gap-0">
          {PIPELINE.map((p, i) => {
            const Icon = ICONS[i];
            const boundary = i === 4;
            return (
              <Fragment key={p.label}>
                <motion.li
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ delay: i * 0.06 }}
                  className={`relative flex items-center gap-3 lg:flex-col lg:gap-2 lg:px-1 lg:text-center ${boundary ? "lg:border-l lg:border-dashed lg:border-ns-line2" : ""}`}
                >
                  {boundary && (
                    <span className="mono absolute -top-6 left-2 hidden text-[9.5px] tracking-wider whitespace-nowrap text-ns-blue uppercase lg:block">
                      ▸ digital analysis starts
                    </span>
                  )}
                  <span
                    className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl border bg-ns-surface ${
                      p.category === "physical" ? "border-ns-green/40" : "border-ns-blue/40"
                    }`}
                  >
                    <Icon className={`h-5 w-5 ${CAT_TEXT[p.category]}`} />
                    <span className="mono absolute -top-2 -right-2 grid h-5 w-5 place-items-center rounded-full bg-ns-text text-[9.5px] text-ns-bg">{i + 1}</span>
                  </span>
                  <span className="text-[12.5px] leading-tight font-medium">{p.label}</span>
                  {i < PIPELINE.length - 1 && <span className="ns-wire absolute top-6 left-[calc(50%+30px)] hidden w-[calc(100%-60px)] lg:block" aria-hidden />}
                </motion.li>
              </Fragment>
            );
          })}
        </ol>
        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-ns-amber/50 px-5 py-3.5 text-[14px]">
          <span className="font-semibold">No calibration data → no concentration.</span>
          <span className="text-ns-text2">RGB values are never silently turned into an adulterant concentration. Without calibration the app says: “Calibration required for quantitative estimation.”</span>
        </div>
      </section>

      {/* Story */}
      <section className="border-y border-ns-line bg-ns-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="ns-eyebrow">The story we demonstrate</p>
          <h2 className="mt-1 mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">Qualitative detection first, quantitative only with calibration</h2>
          <ol className="grid gap-3 md:grid-cols-3">
            {STORY.map((s, i) => (
              <li
                key={i}
                className={`ns-card flex gap-3 border-l-2 p-4 ${s.category === "physical" ? "!border-l-ns-green" : s.category === "digital" ? "!border-l-ns-blue" : "!border-l-ns-amber"}`}
              >
                <span className="mono text-[12px] font-semibold text-ns-muted">{String(i + 1).padStart(2, "0")}</span>
                <span className="text-[14px] leading-relaxed">{s.text}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Transparency */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <p className="ns-eyebrow">Prototype demonstration status</p>
        <h2 className="mt-1 mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">What is real and what is simulated?</h2>
        <StatusLists />
      </section>

      <section className="border-t border-ns-line bg-ns-surface/50">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="ns-eyebrow">Technology stack</p>
          <h2 className="mt-1 mb-8 text-2xl font-semibold tracking-tight sm:text-3xl">Four layers, one result</h2>
          <TechStack />
        </div>
      </section>
    </>
  );
}

export function TechStack() {
  return (
    <ol className="grid gap-3 md:grid-cols-4">
      {TECH.map((t, i) => (
        <li key={t.layer} className="ns-card relative p-5 text-center">
          <div className="mono text-[11px] font-semibold tracking-[0.18em] text-ns-blue uppercase">{t.layer}</div>
          <ArrowDown className="mx-auto my-2 h-4 w-4 text-ns-muted" />
          <div className="text-[14px] leading-snug font-medium">{t.what}</div>
          <div className="mt-3 flex justify-center">
            <Tag c={t.category} />
          </div>
          {i < TECH.length - 1 && <span className="absolute top-1/2 -right-2.5 hidden text-ns-muted md:block">→</span>}
        </li>
      ))}
    </ol>
  );
}
