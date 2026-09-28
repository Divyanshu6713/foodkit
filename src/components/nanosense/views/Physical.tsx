"use client";
import { CircleCheck, ImageOff } from "lucide-react";
import { CONTROL_RUNS, OBSERVATIONS, SAMPLE_KINDS } from "@/content/nanosense";
import { go } from "../nav";
import { PhotoInput } from "../photo";
import { useDerived, useNS } from "../store";
import { Btn, Card, Field, inputCls, Note, ResultStates, Source, StepHeader, Term } from "../ui";

export function Physical() {
  const { ws, all, current, isDemo } = useDerived();
  const set = useNS((s) => s.set);
  const updateSample = useNS((s) => s.updateSample);
  const active = ws.active;
  const s = ws.samples[active];
  const custom = s.observation !== "" && !(OBSERVATIONS as readonly string[]).includes(s.observation);
  const role = SAMPLE_KINDS.find((k) => k.id === active)!;

  return (
    <>
      <StepHeader
        n={2}
        title="Physical Test Result"
        category="physical"
        lead="Record what the real laboratory experiment produced: the observation and a photograph of the response. Everything digital starts from this input."
      />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Source kind={isDemo ? "simulated" : "experimental"} />
        <span className="text-[12.5px] text-ns-text2">
          {isDemo ? "Simulation mode: synthetic samples, not a real experiment." : "Real Experiment mode: these inputs come from the physical demonstration."}
        </span>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.15fr_1fr]">
        <Card className="p-6">
          <Field label="Test / control type">
            <div className="inline-flex flex-wrap rounded-full border border-ns-line2 bg-ns-surface2 p-1" role="radiogroup" aria-label="Test / control type">
              {SAMPLE_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  role="radio"
                  aria-checked={active === k.id}
                  title={k.desc}
                  onClick={() => set({ active: k.id })}
                  className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${active === k.id ? "bg-ns-blue text-white" : "text-ns-text2 hover:text-ns-text"}`}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </Field>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field label="Sample ID">
              <input className={`${inputCls} mono`} value={s.id} onChange={(e) => updateSample(active, { id: e.target.value.toUpperCase() })} />
            </Field>
            <Field label="Food type">
              <input className={inputCls} value={ws.foodType} onChange={(e) => set({ foodType: e.target.value })} />
            </Field>
            <Field label="Target adulterant">
              <input className={inputCls} value={ws.target} onChange={(e) => set({ target: e.target.value })} />
            </Field>
            <Field label="Reference / control run">
              <select className={inputCls} value={s.controlRun} onChange={(e) => updateSample(active, { controlRun: e.target.value })}>
                {CONTROL_RUNS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Physical observation">
                <select
                  className={inputCls}
                  value={custom ? "__custom" : s.observation}
                  onChange={(e) => updateSample(active, { observation: e.target.value === "__custom" ? " " : e.target.value })}
                >
                  <option value="">Select what was observed…</option>
                  {OBSERVATIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                  <option value="__custom">Other (describe)…</option>
                </select>
              </Field>
              {custom && (
                <input
                  className={`${inputCls} mt-2`}
                  placeholder="Describe what was observed"
                  value={s.observation.trimStart()}
                  onChange={(e) => updateSample(active, { observation: e.target.value || " " })}
                />
              )}
            </div>
            <label className="flex items-center gap-2 text-[13px] sm:col-span-2">
              <input type="checkbox" checked={ws.physicalDone} onChange={(e) => set({ physicalDone: e.target.checked })} className="h-4 w-4 accent-[var(--ns-green)]" />
              Physical laboratory test performed and observed
            </label>
          </div>

          <div className="mt-6 border-t border-ns-line pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-[14px] font-semibold">Photograph of the physical response</h2>
              {s.photo && <Source kind={s.photoSource === "synthetic" ? "simulated" : "experimental"} />}
            </div>
            {isDemo ? (
              <p className="text-[13px] text-ns-text2">Simulation mode uses a synthetic image. Switch to Real Experiment mode to upload or capture your own photograph.</p>
            ) : (
              <PhotoInput
                hasPhoto={!!s.photo}
                onPhoto={(photo, source) => {
                  updateSample(active, { photo, photoSource: source, capturedAt: new Date().toISOString(), roi: null, whiteRoi: null, sampleRgb: null, whiteRgb: null });
                  set({ physicalDone: true });
                }}
              />
            )}
            {s.photo && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-ns-green/40 bg-ns-green/[0.08] px-3 py-2 text-[13px] font-semibold text-ns-green">
                <CircleCheck className="h-4 w-4" /> Physical test captured ✓
                <span className="mono ml-auto text-[10.5px] font-normal text-ns-muted">
                  {s.photoSource} · {s.capturedAt ? new Date(s.capturedAt).toLocaleTimeString() : ""}
                </span>
              </div>
            )}
          </div>
        </Card>

        <div className="flex flex-col gap-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ns-line bg-ns-surface2 px-5 py-3">
              <span className="text-[13px] font-semibold">Physical test result</span>
              <Source kind={isDemo ? "simulated" : "experimental"} />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-[10rem_1fr]">
              <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-lg border border-ns-line bg-ns-surface2">
                {s.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.photo} alt={`Photograph of ${s.id}`} className="h-full w-full object-cover" />
                ) : (
                  <span className="flex flex-col items-center gap-1 text-[11px] text-ns-muted">
                    <ImageOff className="h-5 w-5" /> No photograph yet
                  </span>
                )}
              </div>
              <dl className="grid content-start gap-2 text-[13px]">
                {(
                  [
                    ["Sample", s.id],
                    ["Food / target", `${ws.foodType} / ${ws.target.toUpperCase()}`],
                    ["Test / control type", role.label],
                    ["Physical observation", s.observation.trim() || "— not recorded"],
                  ] as const
                ).map(([k, v]) => (
                  <div key={k}>
                    <dt className="mono text-[10px] tracking-[0.12em] text-ns-muted uppercase">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
                <div>
                  <dt className="mono text-[10px] tracking-[0.12em] text-ns-muted uppercase">Physical test</dt>
                  <dd className={`font-semibold ${ws.physicalDone ? "text-ns-green" : "text-ns-amber"}`}>{ws.physicalDone ? "COMPLETED" : "PENDING"}</dd>
                </div>
              </dl>
            </div>
          </Card>
          <Card className="p-4">
            <div className="mb-2 text-[12px] font-medium text-ns-text2">
              All three samples: <Term k="control">control</Term>, <Term k="reference">reference positive</Term> and unknown
            </div>
            <div className="grid grid-cols-3 gap-2">
              {SAMPLE_KINDS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => set({ active: k.id })}
                  className={`rounded-lg border p-1.5 text-left ${active === k.id ? "border-ns-blue bg-ns-blue/[0.06]" : "border-ns-line"}`}
                >
                  <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded bg-ns-surface2">
                    {all[k.id].photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={all[k.id].photo!} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageOff className="h-4 w-4 text-ns-muted" />
                    )}
                  </div>
                  <div className="mono mt-1 truncate text-[10px]">{all[k.id].id}</div>
                  <div className="text-[10px] text-ns-muted">{all[k.id].photo ? "captured" : "no photo"}</div>
                </button>
              ))}
            </div>
          </Card>
          <ResultStates state={current.state} compact noResponse={current.observation.startsWith("No visible")} />
        </div>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <Btn onClick={() => go("image")} icon disabled={!s.photo}>
          Analyse the photograph
        </Btn>
        <Btn variant="secondary" onClick={() => go("nano")}>
          How the nano-sensing works
        </Btn>
      </div>
      {!s.photo && <Note className="mt-4">Upload or capture a photograph of {s.id} to continue to image analysis. Without a photo, the result stays qualitative (State A).</Note>}
    </>
  );
}
