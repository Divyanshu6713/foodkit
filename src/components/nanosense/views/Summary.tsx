"use client";
import { CircleCheck, CircleDashed } from "lucide-react";
import { FINAL_STATEMENT } from "@/content/nanosense";
import { formatEstimate } from "../model";
import { useOverlay } from "../nav";
import { useDerived } from "../store";
import { Btn, StepHeader } from "../ui";

export interface SummaryItem {
  title: string;
  status: string;
  done: boolean;
}

/** The final checklist. Live: it reflects what the current workspace actually contains. */
export function useSummary(): { items: SummaryItem[]; result: string; resultOk: boolean } {
  const { all, cal, calibrated, unit, isDemo, ws, calibration } = useDerived();
  const u = all.unknown;
  const anyPhoto = Object.values(all).some((s) => !!s.photo);
  const anyFeature = Object.values(all).some((s) => s.feature !== null);
  const items: SummaryItem[] = [
    { title: "Physical chemistry", status: isDemo ? "Illustrated (simulation mode)" : ws.physicalDone ? "Completed" : "Pending", done: isDemo || ws.physicalDone },
    { title: "Optical response", status: anyPhoto ? (isDemo ? "Demonstrated (synthetic photo)" : "Captured") : "Not captured yet", done: anyPhoto },
    { title: "Image digitalization", status: anyFeature ? "Demonstrated" : "Waiting for ROI selection", done: anyFeature },
    { title: "Nano-sensing pipeline", status: "Simulated (concept illustration)", done: true },
    { title: "ESP32 integration", status: "Proposed / Simulated", done: false },
    {
      title: "Calibration",
      status:
        calibration.status === "experimental" && calibrated
          ? "Experimental data entered (not yet validated)"
          : calibration.status === "illustrative"
            ? "Illustrative dataset only — experimental data required for validated quantitative use"
            : "Experimental data required for validated quantitative use",
      done: false,
    },
  ];
  const result = u.estimate ? `${formatEstimate(cal.fit, u.estimate, unit)}${isDemo ? " (simulated)" : " (from experimental calibration, not validated)"}` : "Calibration required for quantitative estimation.";
  return { items, result, resultOk: !!u.estimate };
}

export function SummaryList({ big = false }: { big?: boolean }) {
  const { items, result, resultOk } = useSummary();
  return (
    <div>
      <ol className="grid gap-2">
        {items.map((it) => (
          <li key={it.title} className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-ns-line bg-ns-surface px-4 ${big ? "py-3.5" : "py-2.5"}`}>
            {it.done ? <CircleCheck className="h-6 w-6 shrink-0 text-ns-green" /> : <CircleDashed className="h-6 w-6 shrink-0 text-ns-amber" />}
            <span className={`mono shrink-0 font-bold sm:w-52 tracking-[0.1em] uppercase ${big ? "text-[13px]" : "text-[11.5px]"}`}>{it.title}</span>
            <span className={`${big ? "text-[15px]" : "text-[13px]"} ${it.done ? "text-ns-text" : "text-ns-text2"}`}>{it.status}</span>
          </li>
        ))}
        <li className={`flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border-2 px-4 ${big ? "py-4" : "py-3"} ${resultOk ? "border-ns-blue/50 bg-ns-blue/[0.06]" : "border-dashed border-ns-amber/50"}`}>
          <span className={`mono shrink-0 font-bold sm:w-[calc(13rem+2.5rem)] tracking-[0.1em] uppercase ${big ? "text-[13px]" : "text-[11.5px]"}`}>Final result</span>
          <span className={`${big ? "text-[16px]" : "text-[13.5px]"} font-semibold`}>{result}</span>
        </li>
      </ol>
      <p className="mt-2 text-[12px] text-ns-muted">Estimated concentration only when valid calibration data is available.</p>
    </div>
  );
}

export function Summary() {
  const open = useOverlay((s) => s.open);
  return (
    <>
      <StepHeader n={14} title="Final Judge Screen" lead="Where the prototype stands today, generated live from the data in this app." />
      <SummaryList big />
      <blockquote className="ns-card mt-6 border-l-4 !border-l-ns-blue p-6 text-[18px] leading-relaxed font-medium text-balance">{FINAL_STATEMENT}</blockquote>
      <div className="mt-6 flex flex-wrap gap-2">
        <Btn onClick={() => open("judge")}>Start Judge Mode</Btn>
      </div>
    </>
  );
}
