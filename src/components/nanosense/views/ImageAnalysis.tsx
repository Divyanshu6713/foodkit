"use client";
import { useState } from "react";
import { ImageOff, Plus } from "lucide-react";
import { FEATURE, IMAGING_CHAIN, IMAGING_NOTE, SAMPLE_KINDS, type Channel } from "@/content/nanosense";
import { go } from "../nav";
import { RoiCrop, RoiEditor, useRoiExtraction, type RoiTool } from "../photo";
import { useDerived, useNS } from "../store";
import { Btn, Card, Chain, Field, inputCls, Note, ResultStates, Source, StepHeader, Term } from "../ui";

export function ImageAnalysis() {
  const { ws, current, isDemo, calibration } = useDerived();
  const set = useNS((s) => s.set);
  const updateSample = useNS((s) => s.updateSample);
  const setCalibrationRows = useNS((s) => s.setCalibrationRows);
  const [tool, setTool] = useState<RoiTool>("sample");
  const [conc, setConc] = useState("");
  const [rep, setRep] = useState("1");
  const [added, setAdded] = useState<string | null>(null);
  const active = ws.active;
  const s = ws.samples[active];
  useRoiExtraction(active);

  const srcKind = isDemo || s.photoSource === "synthetic" ? "simulated" : "measured";
  const ex = s.sampleRgb;
  const wx = s.whiteRgb;
  // Position in the imaging chain: fixed light, sample, camera, image, ROI, colour extraction.
  const stepAt = !s.photo ? 1 : !s.roi ? 3 : !ex ? 4 : 5;

  const addToCalibration = () => {
    if (current.feature === null || conc.trim() === "" || !Number.isFinite(Number(conc))) return;
    setCalibrationRows([
      ...calibration.rows,
      {
        sampleId: s.id,
        conc: conc.trim(),
        feature: current.feature.toFixed(4),
        replicate: rep,
        notes: `From photo ROI · channel ${ws.channel}${wx ? " · white ref" : " · no white ref"}`,
        origin: "photo",
      },
    ]);
    setAdded(`${s.id} added at ${conc.trim()}`);
    setConc("");
  };

  return (
    <>
      <StepHeader
        n={5}
        title="Photograph Analysis"
        category="digital"
        lead="Select the reaction region, ignore the background, extract representative RGB values and convert them into one normalized optical feature."
      />

      <Card className="mb-5 grid gap-4 p-5 lg:grid-cols-[1fr_1.4fr] lg:items-center">
        <div>
          <div className="text-[13px] font-semibold">Controlled imaging</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ns-text2">{IMAGING_NOTE}</p>
        </div>
        <div>
          <Chain active={stepAt} items={IMAGING_CHAIN.map((c) => ({ label: c }))} />
          <div className="mt-2 flex items-center gap-2">
            <Source kind="simulated" />
            <span className="text-[11.5px] text-ns-muted">Simulated setup diagram: a fixed imaging rig is proposed, not built.</span>
          </div>
        </div>
      </Card>

      <div className="mb-4 inline-flex flex-wrap rounded-full border border-ns-line2 bg-ns-surface p-1" role="radiogroup" aria-label="Sample">
        {SAMPLE_KINDS.map((k) => (
          <button
            key={k.id}
            type="button"
            role="radio"
            aria-checked={active === k.id}
            onClick={() => set({ active: k.id })}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${active === k.id ? "bg-ns-blue text-white" : "text-ns-text2 hover:text-ns-text"}`}
          >
            {k.label} <span className="mono text-[10.5px] opacity-70">{ws.samples[k.id].id}</span>
          </button>
        ))}
      </div>

      {!s.photo ? (
        <Card className="grid place-items-center gap-3 p-10 text-center">
          <ImageOff className="h-8 w-8 text-ns-muted" />
          <p className="text-[14px] text-ns-text2">No photograph for {s.id} yet.</p>
          <Btn onClick={() => go("physical")}>Add a photograph</Btn>
        </Card>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.35fr_1fr]">
          <Card className="p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex rounded-full border border-ns-line2 p-0.5 text-[12.5px]">
                <button
                  type="button"
                  onClick={() => setTool("sample")}
                  className={`rounded-full px-3 py-1 ${tool === "sample" ? "bg-ns-s3 font-semibold text-white" : "text-ns-text2"}`}
                >
                  Draw sample <Term k="roi">ROI</Term>
                </button>
                <button
                  type="button"
                  onClick={() => setTool("white")}
                  className={`rounded-full px-3 py-1 ${tool === "white" ? "bg-ns-text font-semibold text-ns-bg" : "text-ns-text2"}`}
                >
                  Draw <Term k="whiteref">white reference</Term>
                </button>
              </div>
              <Source kind={s.photoSource === "synthetic" ? "simulated" : "experimental"} />
            </div>
            <RoiEditor
              photo={s.photo}
              roi={s.roi}
              whiteRoi={s.whiteRoi}
              tool={tool}
              alt={`Photograph of ${s.id}`}
              onChange={(p) => {
                updateSample(active, p);
                if (p.roi) setTool("white");
              }}
            />
            <p className="mt-2 text-[12px] text-ns-muted">
              Drag on the photo. Draw the sample ROI inside the reaction liquid, away from edges and reflections, then a white reference on the plain white background. Pixels
              outside the ROI are ignored.
            </p>
          </Card>

          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <RoiCrop photo={s.photo} roi={s.roi} label="Sample ROI (cropped)" />
              <RoiCrop photo={s.photo} roi={s.whiteRoi} label="White reference" />
            </div>

            <Card className="p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold">RGB Analysis</span>
                {ex && <Source kind={srcKind} />}
              </div>
              {ex ? (
                <>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 shrink-0 rounded-xl border border-ns-line2" style={{ background: current.colour ?? undefined }} />
                    <div className="mono grid flex-1 grid-cols-3 gap-2 text-center">
                      {(["R", "G", "B"] as const).map((c, i) => (
                        <div key={c} className={`rounded-lg py-1.5 ${ws.channel === c ? "bg-ns-blue/10" : ""}`}>
                          <div className="text-[11px] text-ns-muted">{c}</div>
                          <div className="text-xl font-semibold tabular-nums">{ex.rgb[i].toFixed(0)}</div>
                          <div className="text-[10px] text-ns-muted">± {ex.sd[i].toFixed(1)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="mono mt-3 text-[11px] text-ns-muted">
                    {ex.n.toLocaleString()} pixels used · {ex.excluded.toLocaleString()} excluded (glare, shadow, 10 % trim)
                    {wx && <> · white ref RGB {wx.rgb.map((v) => v.toFixed(0)).join(" / ")}</>}
                  </div>
                </>
              ) : (
                <p className="text-[13px] text-ns-muted">Draw a sample ROI on the photo to extract colour values.</p>
              )}
            </Card>

            <Card className={`p-5 ${current.feature !== null ? "border-ns-blue/40" : ""}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[13px] font-semibold">
                  <Term k="feature">Normalized Optical Feature</Term>
                </span>
                <label className="flex items-center gap-1.5 text-[12px] text-ns-text2">
                  Channel
                  <select value={ws.channel} onChange={(e) => set({ channel: e.target.value as Channel })} className="rounded-md border border-ns-line2 bg-ns-surface px-1.5 py-0.5">
                    {(["R", "G", "B"] as const).map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mono mt-1 text-4xl font-semibold tabular-nums">{current.feature !== null ? current.feature.toFixed(3) : "–.–––"}</div>
              <div className="mono mt-1 text-[11px] text-ns-muted">{FEATURE.formula}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-ns-text2">
                {wx ? "Referenced to the white area in the same photo." : "No white reference: C_ref = 255, so the value is not corrected for lighting."} This is a
                colour measurement, not a concentration.
              </p>
              {current.feature !== null && <Source kind={srcKind} className="mt-3" />}
            </Card>

            {current.feature !== null && (
              <Card className="p-4">
                <div className="text-[12.5px] font-semibold">Is this photo a reference standard of known concentration?</div>
                <p className="mt-0.5 text-[11.5px] text-ns-muted">
                  Add its feature to the {isDemo ? "illustrative" : "experimental"} calibration dataset. Only do this for standards you actually prepared.
                </p>
                <div className="mt-2 grid grid-cols-[1fr_4.5rem_auto] items-end gap-2">
                  <Field label={`Known concentration (${calibration.unit || "unit set on Calibration page"})`}>
                    <input className={`${inputCls} mono py-1.5`} inputMode="decimal" value={conc} onChange={(e) => setConc(e.target.value)} />
                  </Field>
                  <Field label="Replicate">
                    <input className={`${inputCls} mono py-1.5`} value={rep} onChange={(e) => setRep(e.target.value)} />
                  </Field>
                  <Btn variant="secondary" onClick={addToCalibration} disabled={conc.trim() === "" || !Number.isFinite(Number(conc))} className="px-3 py-2">
                    <Plus className="h-4 w-4" /> Add
                  </Btn>
                </div>
                {added && <p className="mt-2 text-[11.5px] text-ns-green">✓ {added}</p>}
              </Card>
            )}
          </div>
        </div>
      )}

      <div className="mt-5">
        <ResultStates state={current.state} noResponse={current.observation.startsWith("No visible")} />
      </div>
      <Note tone="warn" className="mt-5">
        Values here come from the pixels of {isDemo ? "a synthetic image" : "your photograph"}. JPEG compression, automatic white balance and exposure all change them, so they are
        only comparable between photos taken under the same controlled conditions.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("calibration")} icon>
          Go to calibration
        </Btn>
      </div>
    </>
  );
}
