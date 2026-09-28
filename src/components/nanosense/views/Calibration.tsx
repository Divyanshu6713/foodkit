"use client";
import { useRef, useState } from "react";
import { Database, Download, FileUp, FlaskConical, Plus, Trash2, TriangleAlert } from "lucide-react";
import { CSV_COLUMNS, DEMO, FEATURE } from "@/content/nanosense";
import { downloadText, readCalibrationCsv, toCsv, type CsvResult } from "../csv";
import { type CalRow } from "../model";
import { go } from "../nav";
import { useDerived, useNS } from "../store";
import { Btn, Card, inputCls, Note, Readout, StepHeader, Term } from "../ui";
import { CalibrationChart, ResidualChart } from "../viz/Charts";

export function calibrationLabel(status: "none" | "experimental" | "illustrative") {
  return status === "none"
    ? "Not available — experimental data required"
    : status === "illustrative"
      ? "Illustrative / Simulated Dataset — NOT experimental data"
      : "Experimental dataset (user-provided)";
}

const blankRow = (): CalRow => ({ sampleId: "", conc: "", feature: "", replicate: "1", notes: "", origin: "manual" });

export function Calibration() {
  const { cal, calibration, unit, current, isDemo, calibrated } = useDerived();
  const setRows = useNS((s) => s.setCalibrationRows);
  const setUnit = useNS((s) => s.setUnit);
  const loadDemo = useNS((s) => s.loadDemo);
  const setMode = useNS((s) => s.setMode);
  const importExperimental = useNS((s) => s.importExperimental);
  const fileRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<(CsvResult & { name: string }) | null>(null);
  const [editing, setEditing] = useState(false);
  const rows = calibration.rows;
  const empty = rows.length === 0 && !editing;
  const invalidRows = new Map(cal.invalid.map((i) => [i.row, i.reason]));
  const residualOf = new Map(cal.points.map((p, i) => [p.row, cal.residuals[i]]));
  const { fit } = cal;

  const onFile = async (f: File | undefined) => {
    if (!f) return;
    const res = readCalibrationCsv(await f.text());
    setCsv({ ...res, name: f.name });
    if (res.ok) importExperimental(res.rows, f.name);
  };

  const update = (i: number, p: Partial<CalRow>) => setRows(rows.map((r, j) => (j === i ? { ...r, ...p } : r)));

  return (
    <>
      <StepHeader n={6} title="Calibration" category="digital" />
      <Card className="mb-5 border-l-4 !border-l-ns-blue p-5">
        <p className="text-[16px] leading-relaxed font-medium">A calibration curve connects a measured optical response with known reference concentrations.</p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ns-text2">
          Prepare reference samples of known concentration, run the same assay, photograph them under the same conditions and measure their optical feature. Several levels,
          each with replicates, give a <Term k="calibration">calibration</Term> model. Without it, the app does not estimate any concentration.
        </p>
      </Card>

      <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => (onFile(e.target.files?.[0]), (e.target.value = ""))} />

      {/* Dataset status */}
      {calibration.status === "illustrative" ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border-2 border-dashed border-ns-amber/60 bg-ns-amber/[0.07] px-5 py-4">
          <TriangleAlert className="h-5 w-5 text-ns-amber" />
          <span className="mono text-[12.5px] font-bold tracking-[0.08em] text-ns-amber uppercase">Illustrative / Simulated Dataset — NOT experimental data.</span>
          <button type="button" onClick={() => setMode("real")} className="ml-auto text-[13px] font-medium text-ns-blue hover:underline">
            Switch to Real Experiment mode →
          </button>
        </div>
      ) : calibration.status === "experimental" ? (
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-ns-green/45 bg-ns-green/[0.07] px-5 py-3.5">
          <Database className="h-5 w-5 text-ns-green" />
          <span className="text-[13.5px] font-semibold text-ns-green">Experimental dataset · user-provided</span>
          <span className="mono text-[11.5px] text-ns-muted">
            {calibration.fileName ? `${calibration.fileName} · ` : "entered manually · "}
            {rows.length} rows{calibration.updatedAt ? ` · updated ${new Date(calibration.updatedAt).toLocaleString()}` : ""}
          </span>
        </div>
      ) : null}

      {empty ? (
        <Card className="p-8 text-center">
          <FlaskConical className="mx-auto h-9 w-9 text-ns-muted" />
          <h2 className="mt-3 text-xl font-semibold">Calibration dataset not yet available.</h2>
          <p className="mx-auto mt-2 max-w-xl text-[13.5px] text-ns-text2">
            No experimental calibration data has been entered, so quantitative estimation is unavailable. Qualitative detection (States A and B) still works.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Btn onClick={() => fileRef.current?.click()}>
              <FileUp className="h-4 w-4" /> Upload Experimental Calibration Data
            </Btn>
            <Btn
              variant="secondary"
              onClick={() => {
                setEditing(true);
                setRows([blankRow()]);
              }}
            >
              <Plus className="h-4 w-4" /> Enter data manually
            </Btn>
            <Btn variant="secondary" onClick={loadDemo}>
              Load Demonstration Dataset
            </Btn>
          </div>
          <p className="mt-3 text-[11.5px] text-ns-muted">
            The demonstration dataset is clearly labelled <b>Illustrative / Simulated Dataset — NOT experimental data</b> and opens in Simulation mode, separate from your
            experimental data.
          </p>
          <button type="button" onClick={() => downloadText("calibration_template.csv", CSV_COLUMNS.join(",") + "\n")} className="mt-4 text-[12.5px] text-ns-blue hover:underline">
            Download CSV template ({CSV_COLUMNS.join(", ")})
          </button>
        </Card>
      ) : (
        <>
          <div className="grid gap-5 lg:grid-cols-[1fr_19rem]">
            <Card className="p-5">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] font-semibold">Calibration graph</h2>
                <span className="text-[11.5px] text-ns-muted">{calibrationLabel(calibration.status)}</span>
              </div>
              <div className="mb-1 flex flex-wrap gap-x-4 text-[11.5px] text-ns-text2">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full border-2 border-ns-s1" /> {isDemo ? "Illustrative points" : "Experimental points"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-3 w-px bg-ns-text2" /> Mean ± SD of <Term k="replicate">replicates</Term>
                </span>
                {fit.ok && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-0.5 w-4 bg-ns-s1" /> Fitted line (<Term k="regression">least squares</Term>)
                  </span>
                )}
                {calibrated && current.feature !== null && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-ns-s3" /> {current.id}
                  </span>
                )}
              </div>
              <CalibrationChart
                points={cal.points}
                fit={fit}
                unit={unit}
                levels={cal.levels}
                pointColour={isDemo ? "var(--ns-s2)" : "var(--ns-s1)"}
                unknown={current.estimate && current.feature !== null ? { signal: current.feature, conc: current.estimate.value, label: current.id } : undefined}
              />
              {!fit.ok && cal.points.length > 0 && (
                <p className="mt-2 rounded-lg bg-ns-surface2 px-3 py-2 text-[12.5px] text-ns-text2">
                  Points plotted, no model fitted. {fit.reason}
                </p>
              )}
            </Card>

            <div className="flex flex-col gap-3">
              {fit.ok ? (
                <>
                  <Readout
                    label="Calibration model"
                    value={
                      <span className="text-[14px]">
                        F = {fit.slope.toFixed(4)}·c {fit.intercept >= 0 ? "+" : "−"} {Math.abs(fit.intercept).toFixed(4)}
                      </span>
                    }
                    sub={`c = concentration (${unit}), F = optical feature`}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Readout label={<Term k="r2">R²</Term>} value={fit.r2.toFixed(4)} />
                    <Readout label={<Term k="syx">s_y/x</Term>} value={fit.syx.toFixed(4)} sub="residual SD" />
                    <Readout label="Points" value={fit.n} sub={`${fit.levels} levels`} />
                    <Readout label="Range" value={<span className="text-[15px]">{`${+fit.minConc.toPrecision(4)}–${+fit.maxConc.toPrecision(4)}`}</span>} sub={unit} />
                  </div>
                  <Card className="p-3">
                    <div className="mb-1 text-[12px] font-semibold">
                      <Term k="residual">Residuals</Term>
                    </div>
                    <ResidualChart points={cal.points} residuals={cal.residuals} unit={unit} height={140} />
                    <p className="text-[11px] leading-snug text-ns-muted">Random scatter around zero supports a linear model. A curved pattern means the straight line is not appropriate.</p>
                  </Card>
                </>
              ) : (
                <Card className="p-5 text-[13px] leading-relaxed">
                  <div className="font-semibold">No calibration model</div>
                  <p className="mt-1 text-ns-text2">{fit.reason}</p>
                  <p className="mt-2 font-medium text-ns-amber">Calibration required for quantitative estimation.</p>
                </Card>
              )}
            </div>
          </div>

          {/* Table */}
          <Card className="mt-5 overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 border-b border-ns-line px-5 py-3">
              <h2 className="text-[14px] font-semibold">Calibration data</h2>
              <label className="flex items-center gap-2 text-[12.5px] text-ns-text2">
                Concentration unit
                <input className={`${inputCls} w-28 py-1`} placeholder="e.g. mM" value={calibration.unit} onChange={(e) => setUnit(e.target.value)} />
              </label>
              <div className="ml-auto flex flex-wrap gap-2">
                <Btn variant="secondary" className="px-3 py-1.5 text-[12.5px]" onClick={() => fileRef.current?.click()}>
                  <FileUp className="h-4 w-4" /> Upload Experimental Calibration Data
                </Btn>
                <Btn
                  variant="secondary"
                  className="px-3 py-1.5 text-[12.5px]"
                  onClick={() => downloadText(`${isDemo ? "ILLUSTRATIVE_" : "experimental_"}calibration.csv`, toCsv(rows))}
                  disabled={!rows.length}
                >
                  <Download className="h-4 w-4" /> Export CSV
                </Btn>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-[13px]">
                <thead>
                  <tr className="border-b border-ns-line text-left text-[10.5px] tracking-wider text-ns-muted uppercase">
                    <th className="px-4 py-2 font-medium">Reference sample</th>
                    <th className="px-2 py-2 font-medium">Known concentration ({calibration.unit || "unit"})</th>
                    <th className="px-2 py-2 font-medium">Optical feature (F)</th>
                    <th className="px-2 py-2 font-medium">Replicate</th>
                    <th className="px-2 py-2 font-medium">Notes</th>
                    <th className="px-2 py-2 font-medium">Residual</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const bad = invalidRows.get(i);
                    const res = residualOf.get(i);
                    return (
                      <tr key={i} className={`border-b border-ns-line last:border-0 ${bad ? "bg-ns-amber/[0.06]" : ""}`}>
                        <td className="px-4 py-1.5">
                          <input className={`${inputCls} mono py-1`} value={r.sampleId} aria-label={`Row ${i + 1} sample`} onChange={(e) => update(i, { sampleId: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={`${inputCls} mono py-1`} inputMode="decimal" value={r.conc} aria-label={`Row ${i + 1} concentration`} onChange={(e) => update(i, { conc: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={`${inputCls} mono py-1`} inputMode="decimal" value={r.feature} aria-label={`Row ${i + 1} feature`} onChange={(e) => update(i, { feature: e.target.value })} />
                        </td>
                        <td className="w-20 px-2 py-1.5">
                          <input className={`${inputCls} mono py-1`} value={r.replicate} aria-label={`Row ${i + 1} replicate`} onChange={(e) => update(i, { replicate: e.target.value })} />
                        </td>
                        <td className="px-2 py-1.5">
                          <input className={`${inputCls} py-1`} value={r.notes} aria-label={`Row ${i + 1} notes`} onChange={(e) => update(i, { notes: e.target.value })} />
                          {bad && <div className="mt-0.5 text-[10.5px] text-ns-amber">Excluded: {bad}</div>}
                        </td>
                        <td className="mono px-2 py-1.5 text-[12px] text-ns-text2 tabular-nums">{res !== undefined && Number.isFinite(res) ? (res >= 0 ? "+" : "") + res.toFixed(4) : "—"}</td>
                        <td className="pr-3">
                          <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="rounded p-1.5 text-ns-muted hover:text-ns-amber" aria-label={`Remove row ${i + 1}`}>
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="flex flex-wrap items-center gap-4 border-t border-ns-line px-5 py-3 text-[12.5px]">
              <button type="button" onClick={() => setRows([...rows, blankRow()])} className="inline-flex items-center gap-1.5 font-medium text-ns-blue">
                <Plus className="h-4 w-4" /> Add row
              </button>
              <span className="text-ns-muted">
                F is defined as <span className="mono">{FEATURE.formula}</span>. Rows with a missing value are kept but excluded from the fit, never filled in.
              </span>
              {rows.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(isDemo ? "Clear the illustrative dataset?" : "Delete all experimental calibration rows from this browser?")) {
                      setEditing(false);
                      setRows([]);
                    }
                  }}
                  className="ml-auto text-ns-muted hover:text-ns-amber"
                >
                  Clear dataset
                </button>
              )}
            </div>
          </Card>
        </>
      )}

      {csv && (
        <Card className={`mt-5 p-4 text-[12.5px] ${csv.ok ? "border-ns-green/40" : "border-ns-amber/50"}`}>
          <div className="font-semibold">
            {csv.ok ? `✓ ${csv.name}: ${csv.rows.length} rows imported as experimental, user-provided data.` : `✗ ${csv.name} was not imported.`}
          </div>
          {[...csv.errors, ...csv.warnings].map((m) => (
            <div key={m} className={csv.errors.includes(m) ? "text-ns-amber" : "text-ns-text2"}>
              • {m}
            </div>
          ))}
        </Card>
      )}

      <Note tone="warn" className="mt-5">
        {isDemo
          ? `The illustrative dataset follows F = ${DEMO.f0} + ${DEMO.k}·c plus noise. It was generated by this app and shows how calibration works; it is not a measurement.`
          : "An experimental calibration shows the relationship for your conditions only. Validated quantitative use still needs repeatability testing, controls and independent validation."}
      </Note>
      <div className="mt-5 flex flex-wrap gap-2">
        <Btn onClick={() => go("unknown")} icon>
          Analyse the unknown sample
        </Btn>
        <Btn variant="secondary" onClick={() => go("references")}>
          Published reference data
        </Btn>
      </div>
    </>
  );
}
