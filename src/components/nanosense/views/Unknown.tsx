"use client";
import { CircleCheck, CircleDashed, ImageOff } from "lucide-react";
import { formatEstimate, fmtNum } from "../model";
import { go } from "../nav";
import { useDerived, useNS } from "../store";
import { Btn, Card, Note, ResultStates, Source, StepHeader, Term } from "../ui";
import { CalibrationChart } from "../viz/Charts";

export function nanoResponse(observation: string) {
  const o = observation.trim().toLowerCase();
  if (!o) return "Not recorded";
  if (o.startsWith("no visible")) return "Not observed";
  if (o.startsWith("weak")) return "Weak response";
  return "Detected";
}

export const UNAVAILABLE = "Quantitative estimation unavailable — calibration data required.";

export function Unknown() {
  const { all, cal, calibrated, unit, isDemo, calibration } = useDerived();
  const set = useNS((s) => s.set);
  const u = all.unknown;
  const steps = [
    { label: "Unknown photograph", done: !!u.photo },
    { label: "ROI selection", done: !!u.roi },
    { label: "RGB extraction", done: !!u.sampleRgb },
    { label: "Optical feature", done: u.feature !== null },
    { label: "Calibration curve", done: calibrated },
    { label: "Estimated concentration", done: !!u.estimate },
  ];
  const openImage = () => {
    set({ active: "unknown" });
    go("image");
  };

  return (
    <>
      <StepHeader
        n={8}
        title="Unknown Sample"
        category="digital"
        lead="The unknown's optical feature is placed on the calibration curve. A concentration is only reported when a calibration model exists."
      />

      <Card className="mb-5 overflow-x-auto p-4">
        <ol className="flex min-w-[720px] items-center">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-1 items-center last:flex-none">
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-[12.5px] font-medium ${s.done ? "border-ns-blue/40 bg-ns-blue/[0.07] text-ns-text" : "border-dashed border-ns-line2 text-ns-muted"}`}>
                {s.done ? <CircleCheck className="h-4 w-4 text-ns-blue" /> : <CircleDashed className="h-4 w-4" />}
                {s.label}
              </div>
              {i < steps.length - 1 && <span className={`mx-1 h-px flex-1 ${s.done ? "bg-ns-blue" : "bg-ns-line2"}`} />}
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-5 lg:grid-cols-[1fr_1.25fr]">
        <Card className="p-5">
          <div className="flex gap-4">
            <button type="button" onClick={openImage} className="grid aspect-[4/3] w-36 shrink-0 place-items-center overflow-hidden rounded-lg border border-ns-line bg-ns-surface2" aria-label="Open photograph analysis">
              {u.photo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={u.photo} alt={`Photograph of ${u.id}`} className="h-full w-full object-cover" />
              ) : (
                <ImageOff className="h-5 w-5 text-ns-muted" />
              )}
            </button>
            <div className="min-w-0">
              <div className="mono text-[11px] tracking-wider text-ns-muted uppercase">Unknown sample</div>
              <div className="mono text-2xl font-semibold">{u.id}</div>
              <div className="text-[13px] text-ns-text2">{u.observation.trim() || "Observation not recorded"}</div>
              {u.photo && <Source kind={u.photoSource === "synthetic" ? "simulated" : "experimental"} className="mt-2" />}
            </div>
          </div>
          <dl className="mt-4 divide-y divide-ns-line text-[13px]">
            <Row k="Physical response" v={nanoResponse(u.observation)} />
            <Row k="ROI RGB" v={u.sampleRgb ? u.sampleRgb.rgb.map((v) => v.toFixed(0)).join(" / ") : "—"} />
            <Row k="White reference" v={u.whiteRgb ? "yes" : u.sampleRgb ? "none (uncorrected)" : "—"} />
            <Row k={<Term k="feature">Optical feature F</Term>} v={u.feature !== null ? u.feature.toFixed(4) : "—"} />
          </dl>
          {u.feature !== null && <Source kind={isDemo ? "simulated" : "measured"} className="mt-3" />}
          {!u.photo && (
            <Btn variant="secondary" onClick={() => (set({ active: "unknown" }), go("physical"))} className="mt-4">
              Add the unknown&apos;s photograph
            </Btn>
          )}
          {u.photo && u.feature === null && (
            <Btn variant="secondary" onClick={openImage} className="mt-4">
              Select the ROI
            </Btn>
          )}
        </Card>

        <div className="flex flex-col gap-4">
          {u.estimate ? (
            <Card className="relative overflow-hidden p-6">
              <div className="absolute -top-16 -right-16 h-48 w-48 rounded-full bg-ns-s3/10 blur-2xl" aria-hidden />
              <div className="mono text-[11px] tracking-[0.14em] text-ns-muted uppercase">Estimated concentration · {u.id}</div>
              <div className="mono mt-2 text-5xl font-semibold tracking-tight tabular-nums">{formatEstimate(cal.fit, u.estimate, unit)}</div>
              {u.estimate.status === "in-range" ? (
                <div className="mono mt-1 text-[13px] text-ns-text2">
                  ± {u.estimate.sd.toFixed(2)} {unit} (1 SD, from the regression)
                </div>
              ) : (
                <p className="mt-1 text-[12.5px] text-ns-amber">Outside the calibrated range ({fmtNum(cal.fit.minConc)}–{fmtNum(cal.fit.maxConc)} {unit}). The value is not extrapolated.</p>
              )}
              <div className="mt-3">
                {isDemo ? (
                  <Source kind="simulated" />
                ) : (
                  <span className="mono inline-flex items-center gap-1.5 rounded-md border border-ns-green/45 bg-ns-green/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] text-ns-green uppercase">
                    From experimental calibration · not validated
                  </span>
                )}
              </div>
              <p className="mt-4 text-[12.5px] text-ns-text2">Estimated concentration calculated from calibration model.</p>
            </Card>
          ) : (
            <Card className="border-2 border-dashed !border-ns-amber/50 p-6">
              <div className="text-[18px] leading-snug font-semibold">{UNAVAILABLE}</div>
              <p className="mt-2 text-[13px] leading-relaxed text-ns-text2">
                {!calibrated
                  ? calibration.rows.length === 0
                    ? "No calibration dataset is available. The optical feature is a colour measurement, not a concentration, so no concentration is reported."
                    : `A calibration dataset exists but no model could be fitted: ${cal.fit.reason}`
                  : "The unknown's optical feature has not been extracted yet."}
              </p>
              <p className="mt-2 text-[13px] font-medium">Calibration required for quantitative estimation.</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {!calibrated && (
                  <Btn onClick={() => go("calibration")} icon>
                    Go to calibration
                  </Btn>
                )}
                {u.feature === null && u.photo && (
                  <Btn variant="secondary" onClick={openImage}>
                    Extract the optical feature
                  </Btn>
                )}
              </div>
            </Card>
          )}
          <Card className="p-4">
            <div className="mb-1 text-[12.5px] font-semibold">Unknown on the calibration graph</div>
            {calibrated ? (
              <CalibrationChart
                points={cal.points}
                fit={cal.fit}
                unit={unit}
                height={240}
                levels={cal.levels}
                pointColour={isDemo ? "var(--ns-s2)" : "var(--ns-s1)"}
                unknown={u.estimate && u.feature !== null ? { signal: u.feature, conc: u.estimate.value, label: u.id } : undefined}
              />
            ) : (
              <div className="grid h-[180px] place-items-center rounded-lg border border-dashed border-ns-line2 text-[12.5px] text-ns-muted">No calibration curve available</div>
            )}
          </Card>
        </div>
      </div>

      <h2 className="mt-8 mb-3 text-[15px] font-semibold">Result state</h2>
      <ResultStates state={u.state} noResponse={u.observation.startsWith("No visible")} />
      <Note tone="warn" className="mt-5">
        The app never converts RGB values into a concentration without a calibration model. Even with one, a validated field result requires controls, repeatability testing
        and analytical validation.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("comparison")} icon>
          Compare with control and reference
        </Btn>
      </div>
    </>
  );
}

function Row({ k, v }: { k: React.ReactNode; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <dt className="text-ns-text2">{k}</dt>
      <dd className="mono font-medium">{v}</dd>
    </div>
  );
}
