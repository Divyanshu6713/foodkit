"use client";
import { ImageOff } from "lucide-react";
import { ASSAY } from "@/content/nanosense";
import { formatEstimate, mix } from "../model";
import { useDerived } from "../store";
import { Source } from "../ui";
import { CalibrationChart } from "../viz/Charts";
import { TestTube } from "../viz/TestTube";
import { UNAVAILABLE } from "../views/Unknown";

/** Pieces shared by Follow the Sample and Judge Mode. They always show the current workspace. */

export function IllustrativeTubes({ ts = [0, 1, 0.7], labels = ["Control", "Reference", "Unknown"] }: { ts?: number[]; labels?: string[] }) {
  return (
    <div className="text-center">
      <div className="flex items-end justify-center gap-8">
        {ts.map((t, i) => (
          <div key={labels[i]} className="text-center">
            <TestTube colour={mix(ASSAY.colours.control, ASSAY.colours.positive, t)} className="mx-auto h-44 w-auto" label={labels[i]} />
            <div className="mt-1 text-[12px] font-medium">{labels[i]}</div>
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-ns-muted">Illustration (assay colours)</div>
    </div>
  );
}

export function SamplePhotos() {
  const { all } = useDerived();
  const list = [all.control, all.reference, all.unknown];
  if (!list.some((s) => s.photo)) return <IllustrativeTubes />;
  return (
    <div className="grid w-full grid-cols-3 gap-3">
      {list.map((s) => (
        <figure key={s.kind} className="text-center">
          <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-ns-line bg-ns-surface2">
            {s.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.photo} alt={`Photograph of ${s.id}`} className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-5 w-5 text-ns-muted" />
            )}
          </div>
          <figcaption className="mono mt-1 text-[11px]">{s.id}</figcaption>
        </figure>
      ))}
    </div>
  );
}

export function UnknownPhoto() {
  const { all } = useDerived();
  const u = all.unknown;
  if (!u.photo)
    return (
      <div className="flex flex-col items-center gap-2 text-center text-[13px] text-ns-muted">
        <ImageOff className="h-8 w-8" /> No photograph of the unknown yet
      </div>
    );
  return (
    <div className="w-full max-w-md">
      <div className="relative overflow-hidden rounded-xl border border-ns-line2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={u.photo} alt={`Photograph of ${u.id}`} className="block w-full" />
        {u.roi && (
          <div
            className="absolute border-2 border-ns-s3 shadow-[0_0_0_9999px_rgba(0,0,0,0.4)]"
            style={{ left: `${u.roi.x * 100}%`, top: `${u.roi.y * 100}%`, width: `${u.roi.w * 100}%`, height: `${u.roi.h * 100}%` }}
          />
        )}
        {u.whiteRoi && (
          <div
            className="absolute border-2 border-dashed border-white"
            style={{ left: `${u.whiteRoi.x * 100}%`, top: `${u.whiteRoi.y * 100}%`, width: `${u.whiteRoi.w * 100}%`, height: `${u.whiteRoi.h * 100}%` }}
          />
        )}
      </div>
      <Source kind={u.photoSource === "synthetic" ? "simulated" : "experimental"} className="mt-2" />
    </div>
  );
}

export function FeatureView() {
  const { all, isDemo, ws } = useDerived();
  const u = all.unknown;
  if (!u.sampleRgb || u.feature === null) return <div className="text-center text-[14px] text-ns-muted">Select the reaction region (ROI) to extract RGB values.</div>;
  return (
    <div className="text-center">
      <div className="mono flex justify-center gap-6">
        {(["R", "G", "B"] as const).map((c, i) => (
          <div key={c}>
            <div className="text-[12px] text-ns-muted">{c}</div>
            <div className="text-3xl font-semibold">{u.sampleRgb!.rgb[i].toFixed(0)}</div>
          </div>
        ))}
      </div>
      <div className="mono mt-5 text-[11px] tracking-[0.14em] text-ns-muted uppercase">Normalized optical feature (channel {ws.channel})</div>
      <div className="mono text-5xl font-semibold">{u.feature.toFixed(3)}</div>
      <Source kind={isDemo || u.photoSource === "synthetic" ? "simulated" : "measured"} className="mt-3" />
    </div>
  );
}

export function CalibrationView({ height = 280 }: { height?: number }) {
  const { cal, calibrated, unit, all, isDemo, calibration } = useDerived();
  const u = all.unknown;
  if (cal.points.length === 0) return <div className="text-center text-[15px] font-medium text-ns-text2">Calibration dataset not yet available.</div>;
  return (
    <div className="w-full">
      <CalibrationChart
        points={cal.points}
        fit={cal.fit}
        unit={unit}
        height={height}
        levels={cal.levels}
        pointColour={isDemo ? "var(--ns-s2)" : "var(--ns-s1)"}
        unknown={calibrated && u.estimate && u.feature !== null ? { signal: u.feature, conc: u.estimate.value, label: u.id } : undefined}
      />
      <div className={`mono mt-2 text-[11px] font-semibold tracking-wider uppercase ${calibration.status === "illustrative" ? "text-ns-amber" : "text-ns-green"}`}>
        {calibration.status === "illustrative" ? "Illustrative / Simulated Dataset — NOT experimental data" : "Experimental dataset · user-provided"}
      </div>
    </div>
  );
}

export function ResultView() {
  const { all, cal, unit, isDemo } = useDerived();
  const u = all.unknown;
  return (
    <div className="text-center">
      {u.estimate ? (
        <>
          <div className="mono text-[11px] tracking-[0.14em] text-ns-muted uppercase">Estimated concentration · {u.id}</div>
          <div className="mono mt-2 text-5xl font-semibold">{formatEstimate(cal.fit, u.estimate, unit)}</div>
          {u.estimate.status === "in-range" && (
            <div className="mono mt-1 text-[13px] text-ns-text2">
              ± {u.estimate.sd.toFixed(2)} {unit}
            </div>
          )}
          <div className={`mt-3 inline-block rounded-md border px-3 py-1 text-[12px] font-semibold ${isDemo ? "border-ns-amber/40 bg-ns-amber/10 text-ns-amber" : "border-ns-green/40 bg-ns-green/10 text-ns-green"}`}>
            {isDemo ? "Demonstration / Simulated Reading" : "From experimental calibration · not validated"}
          </div>
        </>
      ) : (
        <>
          <div className="text-[20px] leading-snug font-semibold">{UNAVAILABLE}</div>
          <div className="mt-2 text-[13px] text-ns-text2">
            State {u.state === "none" ? "—" : u.state}: {u.state === "B" ? "optical feature extracted" : u.state === "A" ? "physical response recorded" : "no physical test recorded yet"}.
          </div>
        </>
      )}
    </div>
  );
}
