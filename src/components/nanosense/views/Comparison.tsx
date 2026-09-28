"use client";
import { useState, type ReactNode } from "react";
import { ImageOff } from "lucide-react";
import { SAMPLE_KINDS, type SampleKind } from "@/content/nanosense";
import { formatEstimate } from "../model";
import { go } from "../nav";
import { useDerived } from "../store";
import { Btn, Card, Note, Source, StepHeader, Tag } from "../ui";
import { CalibrationChart } from "../viz/Charts";
import { nanoResponse } from "./Unknown";

export const SERIES: Record<SampleKind, string> = { control: "var(--ns-s1)", reference: "var(--ns-s2)", unknown: "var(--ns-s3)" };

export function Comparison() {
  const { all, cal, calibrated, unit, isDemo } = useDerived();
  const kinds = SAMPLE_KINDS.map((k) => k.id);
  const features = kinds.map((k) => all[k].feature);
  const maxF = Math.max(0.1, ...features.map((f) => f ?? 0));
  const fit = cal.fit;
  const span = fit.maxConc - fit.minConc || 1;
  const dash = <span className="text-ns-muted">—</span>;

  const rows: { label: string; tag: "physical" | "digital"; cell: (k: SampleKind) => ReactNode }[] = [
    {
      label: "Physical Response",
      tag: "physical",
      cell: (k) => (
        <div className="flex items-center gap-2">
          <div className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded border border-ns-line bg-ns-surface2">
            {all[k].photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={all[k].photo!} alt={`Photograph of ${all[k].id}`} className="h-full w-full object-cover" />
            ) : (
              <ImageOff className="h-4 w-4 text-ns-muted" />
            )}
          </div>
          <span className="text-[12.5px] leading-snug">{nanoResponse(all[k].observation)}</span>
        </div>
      ),
    },
    {
      label: "ROI colour (RGB)",
      tag: "digital",
      cell: (k) =>
        all[k].sampleRgb ? (
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded border border-ns-line2" style={{ background: all[k].colour! }} />
            <span className="mono text-[12px]">{all[k].sampleRgb!.rgb.map((v) => v.toFixed(0)).join(" / ")}</span>
          </div>
        ) : (
          dash
        ),
    },
    {
      label: "Optical Feature F",
      tag: "digital",
      cell: (k) =>
        all[k].feature !== null ? (
          <div>
            <div className="h-2 overflow-hidden rounded-full bg-ns-line">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${Math.max(0, (all[k].feature! / maxF) * 100)}%`, background: SERIES[k] }} />
            </div>
            <div className="mono mt-1 text-[12px] tabular-nums">{all[k].feature!.toFixed(4)}</div>
          </div>
        ) : (
          dash
        ),
    },
    {
      label: "Calibration Position",
      tag: "digital",
      cell: (k) => {
        const e = all[k].estimate;
        if (!e) return <span className="text-[12px] text-ns-muted">{calibrated ? "no feature" : "no calibration"}</span>;
        const pos = Math.max(0, Math.min(1, (e.value - fit.minConc) / span));
        return (
          <div>
            <div className="relative h-2 rounded-full bg-ns-line2">
              <span className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ns-surface" style={{ left: `${pos * 100}%`, background: SERIES[k] }} />
            </div>
            <div className="mono mt-1.5 flex justify-between text-[10px] text-ns-muted">
              <span>{+fit.minConc.toPrecision(3)}</span>
              <span>{e.status === "in-range" ? "in range" : "out of range"}</span>
              <span>{+fit.maxConc.toPrecision(3)}</span>
            </div>
          </div>
        );
      },
    },
    {
      label: "Estimated Concentration",
      tag: "digital",
      cell: (k) =>
        all[k].estimate ? (
          <span className="mono text-[15px] font-semibold">{formatEstimate(fit, all[k].estimate, unit)}</span>
        ) : (
          <span className="text-[12px] font-medium text-ns-amber">Calibration required</span>
        ),
    },
  ];

  return (
    <>
      <StepHeader n={9} title="Control vs Sample Comparison" category="digital" lead="A result only means something next to its control and reference positive, photographed under the same conditions." />
      <div className="mb-4">
        <Source kind={isDemo ? "simulated" : "measured"} />
      </div>
      <Card className="overflow-x-auto">
        <table className="w-full min-w-[680px] text-left">
          <thead>
            <tr className="border-b border-ns-line">
              <th className="px-5 py-3 text-[11px] font-medium tracking-wider text-ns-muted uppercase">Parameter</th>
              {SAMPLE_KINDS.map((k) => (
                <th key={k.id} className="px-4 py-3">
                  <span className="inline-flex items-center gap-2 text-[13px] font-semibold">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES[k.id] }} />
                    {k.id === "reference" ? "Reference" : k.id === "unknown" ? "Unknown" : "Control"}
                  </span>
                  <div className="mono text-[10.5px] font-normal text-ns-muted">{all[k.id].id}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} className="border-b border-ns-line last:border-0">
                <th scope="row" className="px-5 py-3.5 align-middle">
                  <div className="text-[13px] font-medium">{r.label}</div>
                  <Tag c={r.tag} className="mt-1" />
                </th>
                {kinds.map((k) => (
                  <td key={k} className="w-[26%] px-4 py-3.5 align-middle">
                    {r.cell(k)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 text-[14px] font-semibold">Optical feature by sample</h2>
          {features.some((f) => f !== null) ? (
            <FeatureBars kinds={kinds} values={features} ids={kinds.map((k) => all[k].id)} />
          ) : (
            <div className="grid h-56 place-items-center text-[13px] text-ns-muted">No optical features extracted yet</div>
          )}
        </Card>
        <Card className="p-5">
          <h2 className="mb-1 text-[14px] font-semibold">On the calibration curve</h2>
          {calibrated ? (
            <CalibrationChart
              points={cal.points}
              fit={fit}
              unit={unit}
              height={260}
              pointColour="var(--ns-line-2)"
              markers={kinds.filter((k) => all[k].feature !== null).map((k) => ({ label: all[k].id, signal: all[k].feature!, colour: SERIES[k] }))}
            />
          ) : (
            <div className="grid h-[260px] place-items-center text-center text-[13px] text-ns-muted">
              Calibration required for quantitative estimation.
              <br />
              Features can still be compared qualitatively on the left.
            </div>
          )}
        </Card>
      </div>
      <Note className="mt-5">
        The control should show the lowest feature and the reference positive a clearly higher one. If the control responds strongly, the run is not valid.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("esp32")} icon>
          See the future hardware pathway
        </Btn>
      </div>
    </>
  );
}

function FeatureBars({ kinds, values, ids }: { kinds: SampleKind[]; values: (number | null)[]; ids: string[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(0.1, ...values.map((v) => v ?? 0)) * 1.1;
  return (
    <div>
      <div className="flex h-56 items-end gap-6 border-b border-ns-line2 px-4">
        {kinds.map((k, i) => (
          <div key={k} className="relative flex h-full flex-1 flex-col items-center justify-end" onPointerEnter={() => setHover(i)} onPointerLeave={() => setHover(null)}>
            <span className="mono mb-1 text-[11.5px] font-semibold tabular-nums">{values[i] !== null ? values[i]!.toFixed(3) : "n/a"}</span>
            <div
              className="w-full max-w-16 rounded-t transition-all duration-700"
              style={{ height: `${Math.max(0, ((values[i] ?? 0) / max) * 100)}%`, background: SERIES[k], opacity: hover === null || hover === i ? 1 : 0.5 }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex gap-6 px-4">
        {ids.map((id) => (
          <div key={id} className="mono flex-1 text-center text-[11px] text-ns-text2">
            {id}
          </div>
        ))}
      </div>
      <div className="mt-1 text-center text-[11px] text-ns-muted">Normalized optical feature F (uncalibrated)</div>
    </div>
  );
}
