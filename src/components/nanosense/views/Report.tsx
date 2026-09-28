"use client";
import { useMemo } from "react";
import { Download, Printer } from "lucide-react";
import { DrishyaIcon } from "@/components/brand/DrishyaIcon";
import type { Category } from "@/content/nanosense";
import { downloadText } from "../csv";
import { formatEstimate } from "../model";
import { useDerived, useNS } from "../store";
import { Btn, ResultStates, StepHeader, Tag } from "../ui";
import { calibrationLabel } from "./Calibration";
import { nanoResponse, UNAVAILABLE } from "./Unknown";

export function Report() {
  const { all, cal, unit, calibration, calibrated, isDemo, ws } = useDerived();
  const theme = useNS((s) => s.theme);
  const setTheme = useNS((s) => s.setTheme);
  const u = all.unknown;
  const generated = useMemo(() => new Date(), []);
  const reportId = `NS-${generated.toISOString().slice(0, 10).replace(/-/g, "")}-${u.id}${isDemo ? "-SIM" : ""}`;
  const fit = cal.fit;
  const estimate = u.estimate ? formatEstimate(fit, u.estimate, unit) : null;

  const rows: [string, string, Category][] = [
    ["Data source", isDemo ? "SIMULATION — illustrative data" : "REAL EXPERIMENT — laboratory inputs", isDemo ? "simulated" : "physical"],
    ["Sample", u.id, "physical"],
    ["Food / target", `${ws.foodType} / ${ws.target.toUpperCase()}`, "physical"],
    ["Physical test", ws.physicalDone ? "Completed" : "Pending", "physical"],
    ["Physical observation", u.observation.trim() || "—", "physical"],
    ["Photograph", u.photo ? (u.photoSource === "synthetic" ? "Synthetic image (simulation)" : `Captured (${u.photoSource})`) : "Not captured", u.photoSource === "synthetic" ? "simulated" : "physical"],
    ["Nano-sensing", "Concept illustration (mechanism depends on validated assay)", "concept"],
    ["ROI colour (RGB)", u.sampleRgb ? u.sampleRgb.rgb.map((v) => v.toFixed(0)).join(" / ") + (u.whiteRgb ? " · white-referenced" : " · no white reference") : "—", "digital"],
    ["Optical feature F", u.feature !== null ? `${u.feature.toFixed(4)} (channel ${ws.channel})` : "—", "digital"],
    [
      "Calibration",
      calibrated ? `${calibrationLabel(calibration.status)} · F = ${fit.slope.toFixed(4)}c ${fit.intercept >= 0 ? "+" : "−"} ${Math.abs(fit.intercept).toFixed(4)} · R² ${fit.r2.toFixed(3)} · n ${fit.n}` : calibrationLabel(calibration.status),
      calibration.status === "illustrative" ? "simulated" : "digital",
    ],
    ["ESP32 / optical sensor", "Future hardware — simulated, not connected", "simulated"],
  ];

  const print = () => {
    // Print in light colours whatever the current theme is.
    const prev = theme;
    if (prev === "dark") setTheme("light");
    setTimeout(() => {
      window.print();
      if (prev === "dark") setTheme("dark");
    }, 50);
  };

  const download = () => {
    const data = {
      reportId,
      generated: generated.toISOString(),
      dataSource: isDemo ? "simulation (illustrative, not experimental)" : "real experiment (user-provided)",
      resultState: u.state,
      validationStatus: "Prototype Demonstration",
      sample: { id: u.id, foodType: ws.foodType, target: ws.target, observation: u.observation.trim(), physicalTest: ws.physicalDone ? "completed" : "pending", photo: u.photoSource },
      imageAnalysis: u.sampleRgb
        ? { roiRgb: u.sampleRgb.rgb.map((v) => +v.toFixed(2)), roiSd: u.sampleRgb.sd.map((v) => +v.toFixed(2)), whiteRgb: u.whiteRgb?.rgb.map((v) => +v.toFixed(2)) ?? null, channel: ws.channel, feature: u.feature }
        : null,
      calibration: { status: calibration.status, unit, fitted: calibrated, slope: fit.ok ? fit.slope : null, intercept: fit.ok ? fit.intercept : null, r2: fit.ok ? fit.r2 : null, syx: fit.ok ? fit.syx : null, n: fit.n },
      estimate: u.estimate ? { value: u.estimate.value, sd: u.estimate.sd, unit, status: u.estimate.status } : null,
      note: u.estimate ? "Estimated from the calibration model above. Not a validated analytical result." : "Calibration required for quantitative estimation.",
    };
    downloadText(`${reportId}.json`, JSON.stringify(data, null, 2), "application/json");
  };

  return (
    <>
      <div className="ns-noprint">
        <StepHeader n={13} title="Digital Result Report" category="digital" lead="Every result sits next to its source and its validation status." />
        <div className="mb-5 flex flex-wrap gap-2">
          <Btn onClick={print}>
            <Printer className="h-4 w-4" /> Print / Save as PDF
          </Btn>
          <Btn variant="secondary" onClick={download}>
            <Download className="h-4 w-4" /> Download JSON
          </Btn>
        </div>
      </div>

      <article className="ns-card ns-print-area relative mx-auto max-w-3xl overflow-hidden p-0">
        {isDemo && (
          <div
            className="pointer-events-none absolute inset-0 grid place-items-center text-[64px] font-black tracking-widest text-ns-amber/[0.07] select-none"
            style={{ transform: "rotate(-24deg)" }}
            aria-hidden
          >
            SIMULATION
          </div>
        )}
        <header className="flex flex-col items-start justify-between gap-4 border-b border-ns-line bg-ns-surface2 px-5 py-6 sm:flex-row sm:px-7">
          <div className="flex items-center gap-3">
            <DrishyaIcon className="h-11 w-11" />
            <div>
              <div className="text-2xl font-semibold tracking-tight">NanoSense</div>
              <div className="text-[13px] text-ns-text2">Nano-Based Food Adulteration Detection</div>
            </div>
          </div>
          <div className="mono text-[11px] leading-relaxed text-ns-muted sm:text-right">
            <div className="font-semibold text-ns-text">{reportId}</div>
            <div>{generated.toLocaleString()}</div>
            <div>Drishya · Team RootStack</div>
          </div>
        </header>

        <div className="relative px-5 py-6 sm:px-7">
          <dl className="divide-y divide-ns-line">
            {rows.map(([k, v, c]) => (
              <div key={k} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 py-2.5 sm:grid-cols-[11rem_1fr_auto]">
                <dt className="col-span-2 text-[13px] text-ns-text2 sm:col-span-1">{k}</dt>
                <dd className="text-[13.5px] font-medium">{v}</dd>
                <dd>
                  <Tag c={c} />
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-6 grid gap-4 sm:grid-cols-[1.3fr_1fr]">
            <div className="rounded-xl border border-ns-line2 p-5">
              <div className="mono text-[10.5px] tracking-[0.14em] text-ns-muted uppercase">Result</div>
              {estimate ? (
                <>
                  <div className="mono mt-1 text-4xl font-semibold tabular-nums">{estimate}</div>
                  {u.estimate?.status === "in-range" && (
                    <div className="mono mt-1 text-[12px] text-ns-text2">
                      ± {u.estimate.sd.toFixed(2)} {unit} (1 SD, regression)
                    </div>
                  )}
                  <div className={`mono mt-2 text-[10.5px] font-semibold tracking-wider uppercase ${isDemo ? "text-ns-amber" : "text-ns-green"}`}>
                    {isDemo ? "Demonstration / Simulated Reading" : "From experimental calibration · not validated"}
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-1 text-[15px] leading-snug font-semibold">{UNAVAILABLE}</div>
                  <div className="mt-2 text-[12.5px] text-ns-text2">Physical response: {nanoResponse(u.observation).toLowerCase()}.</div>
                </>
              )}
            </div>
            <div className="rounded-xl border border-ns-amber/40 bg-ns-amber/[0.07] p-5">
              <div className="mono text-[10.5px] tracking-[0.14em] text-ns-muted uppercase">Validation Status</div>
              <div className="mt-1 text-xl font-semibold text-ns-amber">Prototype Demonstration</div>
              <div className="mt-2 text-[12px] text-ns-text2">Not a validated analytical result.</div>
            </div>
          </div>

          <div className="mt-5">
            <ResultStates state={u.state} noResponse={u.observation.startsWith("No visible")} />
          </div>

          <p className="mt-5 rounded-xl border-l-4 border-ns-amber bg-ns-surface2 px-4 py-3 text-[13px] leading-relaxed">
            <b>Important:</b> This demonstration illustrates the proposed digital workflow. Final quantitative claims require experimentally validated calibration and analytical
            performance testing.
          </p>
        </div>
      </article>
    </>
  );
}
