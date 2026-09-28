"use client";
import { useEffect, useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { go } from "../nav";
import { Btn, Card, Chain, Note, Readout, SimLabel, StepHeader, Term } from "../ui";
import { AbsorbanceChart, VoltageChart } from "../viz/Charts";
import { useFutureHardware } from "./Esp32";

const STAGES = [
  { label: "Noise filtering", text: "A moving average smooths random fluctuations and single spikes, without blurring the step between dark, blank and sample." },
  { label: "Baseline correction", text: "The dark reading (light source off) is subtracted, removing the sensor's own offset." },
  { label: "Signal normalization", text: "The sample is divided by the blank reading, giving transmittance T and absorbance A = −log₁₀ T, independent of lamp brightness." },
  { label: "Processed signal", text: "The mean of the stable plateau becomes one optical value for this sample." },
];

export function Processing() {
  const { trace } = useFutureHardware();
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState(0);
  const [running, setRunning] = useState(true);

  // Acquisition sweep, then each processing stage in turn.
  useEffect(() => {
    if (!running) return;
    let raf = 0;
    let t0 = 0;
    const tick = (now: number) => {
      if (!t0) t0 = now;
      const p = Math.min(1, (now - t0) / 2200);
      setProgress(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const ts = [1, 2, 3].map((s) => setTimeout(() => setStage(s), 2200 + s * 1300));
    const end = setTimeout(() => setRunning(false), 2200 + 4 * 1300);
    return () => {
      cancelAnimationFrame(raf);
      ts.forEach(clearTimeout);
      clearTimeout(end);
    };
  }, [running]);

  const restart = () => {
    setStage(0);
    setProgress(0);
    setRunning(true);
  };

  return (
    <>
      <StepHeader
        n={11}
        title="Signal Processing (Future Hardware)"
        category="simulated"
        lead="In future hardware, raw sensor readings would be noisy and offset. Three standard steps would turn them into one stable optical value."
      />
      <Card className="mb-5 p-4">
        <Chain active={progress < 1 ? -1 : stage} items={STAGES.map((s) => ({ label: s.label }))} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_18rem]">
        <div className="flex flex-col gap-5">
          <Card className="p-5">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold">Raw Sensor Signal · future hardware</h2>
              <SimLabel>Simulated trace</SimLabel>
            </div>
            <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px] text-ns-text2" aria-label="Legend">
              <LegendItem swatch={<span className="h-0.5 w-4 bg-ns-muted" />} label="Raw" />
              {stage >= 1 && <LegendItem swatch={<span className="h-0.5 w-4 bg-ns-s1" />} label="Filtered" />}
              {stage >= 2 && <LegendItem swatch={<span className="h-0 w-4 border-t-2 border-dashed border-ns-s3" />} label="Dark-corrected" />}
            </div>
            <VoltageChart trace={trace} stage={stage} progress={progress} />
          </Card>
          <Card className={`p-5 transition-opacity duration-500 ${stage >= 3 ? "opacity-100" : "opacity-40"}`}>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold">
                Processed Signal (<Term k="au">absorbance</Term>)
              </h2>
              <SimLabel>Simulated</SimLabel>
            </div>
            {stage >= 3 ? <AbsorbanceChart trace={trace} /> : <div className="grid h-[200px] place-items-center text-[13px] text-ns-muted">Appears after normalisation</div>}
          </Card>
        </div>

        <div className="flex flex-col gap-3">
          <Readout label="Raw Signal" value={trace.stats.rawMean.toFixed(3)} unit="V" sub="Simulated value · mean of sample plateau" />
          <Readout
            label="Processed Signal"
            value={stage >= 3 ? trace.stats.processed.toFixed(3) : "—"}
            unit="AU"
            tone="text-ns-s3"
            sub="Simulated value"
          />
          <Readout label={<Term k="snr">Signal-to-Noise Ratio</Term>} value={trace.stats.snr.toFixed(0)} sub="Demonstration value (simulated noise)" />
          <Readout
            label="Measurement Stability"
            value={stage >= 3 ? trace.stats.cv.toFixed(2) : "—"}
            unit="% CV"
            sub="Demonstration value · plateau variation"
          />
          <Card className="p-4">
            <ol className="space-y-2.5">
              {STAGES.map((s, i) => (
                <li key={s.label} className={`text-[12.5px] leading-relaxed transition-opacity ${stage >= i && progress >= 1 ? "opacity-100" : "opacity-45"}`}>
                  <b className="font-semibold">
                    {i === 1 ? <Term k="baseline">{s.label}</Term> : i === 2 ? <Term k="normalisation">{s.label}</Term> : s.label}.
                  </b>{" "}
                  <span className="text-ns-text2">{s.text}</span>
                </li>
              ))}
            </ol>
          </Card>
          <Btn variant="secondary" onClick={restart} disabled={running}>
            {running ? <Play className="h-4 w-4" /> : <RotateCcw className="h-4 w-4" />}
            {running ? "Processing…" : "Run again"}
          </Btn>
        </div>
      </div>
      <Note tone="warn" className="mt-5">
        Future Hardware — Simulated. This trace is generated by the app to explain the processing steps; it is not connected to the physical test or to your photograph.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("flow")} icon>
          See the complete system flow
        </Btn>
      </div>
    </>
  );
}

function LegendItem({ swatch, label }: { swatch: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {swatch}
      {label}
    </span>
  );
}
