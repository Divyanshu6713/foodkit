"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Cable, ChartScatter, FileCheck, Pause, Play, ScanLine, SlidersHorizontal } from "lucide-react";
import { ASSAY, SIM } from "@/content/nanosense";
import { reading, simulateTrace } from "../model";
import { go } from "../nav";
import { Btn, Card, Note, SimLabel, StepHeader, Term } from "../ui";

/**
 * Illustrative future-hardware values. Deliberately NOT derived from any
 * photo or physical test: the ESP32 is not connected to the experiment.
 */
export function useFutureHardware() {
  return useMemo(() => {
    const rd = reading(SIM.illustrativeAU);
    const trace = simulateTrace(SIM.illustrativeAU, "FUTURE-HW");
    return { rd, trace, processed: trace.stats.processed };
  }, []);
}

const ANIM = [
  "Optical sensor detects light from the sample",
  "Electrical (analog) signal generated",
  "ESP32 ADC samples the voltage",
  "Digital value produced",
  "Signal processing (filter, baseline, normalise)",
  "Calibration model applied (needs experimental data)",
  "Result sent to the application",
];

export function Esp32() {
  const { rd, processed } = useFutureHardware();
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  const maxCount = 2 ** ASSAY.adcBits - 1;

  useEffect(() => {
    if (!playing) return;
    const t = setTimeout(() => setStep((s) => (s + 1) % ANIM.length), step === ANIM.length - 1 ? 3200 : 1800);
    return () => clearTimeout(t);
  }, [playing, step]);

  const packet = JSON.stringify({ device: "ESP32 (simulated)", counts: rd.counts, volts: +rd.volts.toFixed(3), processed: +processed.toFixed(3), simulated: true }, null, 1)
    .replace(/\n\s*/g, " ")
    .replace(/\s}/, " }");

  const node = step;
  const nodes: { label: string; icon: ReactNode; value: ReactNode }[] = [
    { label: "Optical Sensor", icon: <ScanLine className="h-5 w-5" />, value: `${(rd.transmittance * 100).toFixed(1)} % light` },
    { label: "Electrical Signal", icon: <Cable className="h-5 w-5" />, value: `${rd.volts.toFixed(3)} V` },
    { label: "ESP32 ADC", icon: <ChipIcon />, value: `${rd.counts} / ${maxCount}` },
    { label: "Digital Value", icon: <span className="mono text-[11px] font-bold">0101</span>, value: `${rd.counts} counts` },
    { label: "Signal Processing", icon: <SlidersHorizontal className="h-5 w-5" />, value: `${processed.toFixed(3)} AU` },
    { label: "Calibration", icon: <ChartScatter className="h-5 w-5" />, value: "needs exp. data" },
    { label: "Result", icon: <FileCheck className="h-5 w-5" />, value: "future" },
  ];

  return (
    <>
      <StepHeader n={10} title="Future Hardware Pathway" category="simulated" />
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-ns-amber/50 bg-ns-amber/[0.06] px-4 py-3">
        <span className="mono text-[12.5px] font-bold tracking-[0.14em] text-ns-amber uppercase">Future Hardware — Simulated</span>
        <span className="text-[12.5px] text-ns-text2">The ESP32 is not connected to the physical test. All values on this page are illustrative and are not derived from your photograph.</span>
      </div>
      <Card className="mb-5 border-l-4 !border-l-ns-blue p-5">
        <p className="text-[15px] leading-relaxed">
          Today the optical signal is captured with a photograph. In future hardware, a dedicated optical sensor would read it under fixed light and the{" "}
          <Term k="esp32">ESP32</Term> would digitise, process and transmit it. The ESP32 does not perform the chemistry, and it would still need the same experimental
          calibration.
        </p>
      </Card>

      {/* Diagram */}
      <Card className="overflow-x-auto p-5">
        <ol className="flex min-w-[820px] items-center">
          {nodes.map((n, i) => {
            const on = i === node;
            const past = i < node;
            return (
              <li key={n.label} className="flex flex-1 items-center last:flex-none">
                <div className="flex w-[96px] flex-col items-center text-center">
                  <div
                    className={`relative grid h-14 w-14 place-items-center rounded-2xl border-2 transition-all duration-500 ${
                      on ? "scale-105 border-ns-blue bg-ns-blue/10 text-ns-blue" : past ? "border-ns-blue/40 bg-ns-surface text-ns-blue" : "border-ns-line2 bg-ns-surface text-ns-muted"
                    }`}
                  >
                    {on && <span className="ns-pulse absolute inset-0 rounded-2xl border-2 border-ns-blue" />}
                    {n.icon}
                  </div>
                  <div className="mt-2 text-[11.5px] leading-tight font-semibold">{n.label}</div>
                  <div className={`mono mt-0.5 text-[10px] transition-opacity ${past || on ? "text-ns-text2 opacity-100" : "opacity-0"}`}>{n.value}</div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="relative mx-1 -mt-10 flex-1">
                    {i === 0 && step === 1 ? <AnalogWave /> : <div className={`ns-wire ${i < node ? "" : "opacity-40"}`} />}
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">Animation</span>
            <button
              type="button"
              onClick={() => setPlaying((p) => !p)}
              className="inline-flex items-center gap-1.5 rounded-full border border-ns-line2 px-3 py-1 text-[12px] text-ns-text2 hover:text-ns-text"
            >
              {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              {playing ? "Pause" : "Play"}
            </button>
          </div>
          <ol className="space-y-1.5">
            {ANIM.map((a, i) => (
              <li key={a}>
                <button
                  type="button"
                  onClick={() => {
                    setPlaying(false);
                    setStep(i);
                  }}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[13.5px] transition-colors ${
                    i === step ? "bg-ns-blue/10 font-semibold text-ns-blue" : i < step ? "text-ns-text" : "text-ns-muted hover:bg-ns-surface2"
                  }`}
                >
                  <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] ${i <= step ? "bg-ns-blue text-white" : "bg-ns-surface2"}`}>{i + 1}</span>
                  {a}
                </button>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-semibold">Illustrative values along the chain</span>
            <SimLabel>Simulated values</SimLabel>
          </div>
          <dl className="divide-y divide-ns-line text-[13px]">
            <Row show={step >= 0} k={<>Light reaching sensor (<Term k="transmittance">T</Term>)</>} v={`${(rd.transmittance * 100).toFixed(1)} %`} />
            <Row show={step >= 1} k={<><Term k="photodiode">Photodiode</Term> output</>} v={`${rd.volts.toFixed(3)} V`} />
            <Row show={step >= 2} k={<><Term k="adc">ADC</Term> reading ({ASSAY.adcBits}-bit, 0–{ASSAY.adcRefVolts} V)</>} v={`${rd.counts} / ${maxCount}`} />
            <Row show={step >= 3} k="Binary" v={rd.counts.toString(2).padStart(ASSAY.adcBits, "0")} />
            <Row show={step >= 4} k={<>Processed value (<Term k="au">AU</Term>)</>} v={`${processed.toFixed(3)} AU`} />
            <Row show={step >= 5} k="Calibration" v="requires experimental data" />
          </dl>
          <div className={`mt-3 rounded-lg bg-[#0b1220] p-3 transition-opacity ${step >= 6 ? "opacity-100" : "opacity-30"}`}>
            <div className="mono mb-1 text-[10px] tracking-wider text-emerald-300/70 uppercase">→ packet to dashboard (USB serial / Wi-Fi) · simulated</div>
            <code className="mono block text-[11.5px] break-all text-emerald-200">{packet}</code>
          </div>
        </Card>
      </div>
      <Note tone="warn" className="mt-5">
        Nothing on this page is measured. It shows how a dedicated optical sensor and ESP32 could replace the camera in future, not a connection to today&apos;s experiment.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("processing")} icon>
          Future signal processing
        </Btn>
      </div>
    </>
  );
}

function Row({ show, k, v }: { show: boolean; k: ReactNode; v: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <dt className="text-ns-text2">{k}</dt>
      <dd className={`mono font-semibold tabular-nums transition-opacity duration-500 ${show ? "opacity-100" : "opacity-0"}`}>{v}</dd>
    </div>
  );
}

function AnalogWave() {
  return (
    <svg viewBox="0 0 100 20" className="h-6 w-full" preserveAspectRatio="none" aria-hidden>
      <path d="M0 10 Q 6 0 12 10 T 24 10 T 36 10 T 48 10 T 60 10 T 72 10 T 84 10 T 96 10" fill="none" stroke="var(--ns-s2)" strokeWidth="2" className="ns-flow" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

function ChipIcon() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <rect x="7" y="7" width="18" height="18" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <text x="16" y="18.5" textAnchor="middle" fontSize="5.2" fontWeight="700" fill="currentColor" fontFamily="monospace">
        ESP32
      </text>
      {[10, 14, 18, 22].map((p) => (
        <g key={p} stroke="currentColor" strokeWidth="1.5">
          <line x1={p} y1="3" x2={p} y2="7" />
          <line x1={p} y1="25" x2={p} y2="29" />
          <line x1="3" y1={p} x2="7" y2={p} />
          <line x1="25" y1={p} x2="29" y2={p} />
        </g>
      ))}
    </svg>
  );
}
