"use client";
import { ArrowDown, BookOpen, CircleCheck, CircleX, ExternalLink } from "lucide-react";
import { PUBLISHED } from "@/content/nanosense";
import { REFERENCES } from "@/content/research";
import { go } from "../nav";
import { Btn, Card, Note, StepHeader, Tag } from "../ui";

function Flow({ items, ok }: { items: string[]; ok: boolean }) {
  return (
    <div className={`ns-card p-5 ${ok ? "border-t-4 !border-t-ns-green" : "border-t-4 !border-t-ns-amber"}`}>
      <div className={`mb-3 flex items-center gap-2 text-[13px] font-semibold ${ok ? "text-ns-green" : "text-ns-amber"}`}>
        {ok ? <CircleCheck className="h-4 w-4" /> : <CircleX className="h-4 w-4" />}
        {ok ? "How we use published work" : "What we do NOT claim"}
      </div>
      <ol className="flex flex-col items-center gap-1">
        {items.map((t, i) => (
          <li key={t} className="flex flex-col items-center">
            <span className={`rounded-lg border px-4 py-2 text-center text-[13px] font-medium ${ok ? "border-ns-line2 bg-ns-surface" : "border-ns-amber/30 bg-ns-amber/[0.05] text-ns-text2 line-through decoration-ns-amber/60"}`}>
              {t}
            </span>
            {i < items.length - 1 && <ArrowDown className="my-0.5 h-4 w-4 text-ns-muted" />}
          </li>
        ))}
      </ol>
    </div>
  );
}

export function References() {
  const url = (n: number) => REFERENCES.find((r) => r.n === n);
  return (
    <>
      <StepHeader
        n={7}
        title="Published Reference Data"
        category="literature"
        lead="Published analytical methods show that the detection principle is sound. They are kept separate from our own calibration and are never used to turn our camera readings into a concentration."
      />
      <div className="mb-6 grid gap-4 md:grid-cols-2">
        <Flow ok items={["Published method", "Scientific reference", "Supports detection principle"]} />
        <Flow ok={false} items={["Published data", "Our camera", "Validated concentration"]} />
      </div>

      <ol className="grid gap-4 md:grid-cols-2">
        {PUBLISHED.map((p) => {
          const ref = url(p.ref);
          return (
            <li key={p.method}>
              <Card className="flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <BookOpen className="mt-0.5 h-4 w-4 shrink-0 text-ns-text2" />
                    <h2 className="text-[14.5px] leading-snug font-semibold">{p.method}</h2>
                  </div>
                  <Tag c="literature" />
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-ns-text2">{p.principle}</p>
                <div className="mt-3">
                  <div className="mono text-[10px] tracking-[0.12em] text-ns-muted uppercase">Reported by the study (not our measurement)</div>
                  <ul className="mt-1 flex flex-wrap gap-1.5">
                    {p.reported.map((r) => (
                      <li key={r} className="mono rounded-md border border-ns-line bg-ns-surface2 px-2 py-0.5 text-[11.5px]">
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className={`mt-3 rounded-lg px-3 py-2 text-[12.5px] ${p.relevance === "optical" ? "bg-ns-green/[0.07] text-ns-text" : "bg-ns-surface2 text-ns-text2"}`}>
                  <b className="font-semibold">Supports:</b> {p.supports}
                </div>
                <div className="mt-auto flex items-center justify-between gap-3 pt-3 text-[11.5px]">
                  <span className="text-ns-muted">Not used in our calibration</span>
                  {ref && (
                    <a href={ref.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-ns-blue hover:underline">
                      [{ref.n}] {ref.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ol>
      <Note tone="warn" className="mt-5">
        Values are as summarised in our research review. Check each against the original paper before quoting it. A published calibration applies to that study&apos;s
        reagents, instrument and conditions, not to our smartphone photographs.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("unknown")} icon>
          Analyse the unknown sample
        </Btn>
      </div>
    </>
  );
}
