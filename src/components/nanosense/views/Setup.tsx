"use client";
import { CircleCheck, CircleDashed, FlaskConical } from "lucide-react";
import { ASSAY } from "@/content/nanosense";
import { go } from "../nav";
import { useNS, useWorkspace } from "../store";
import { Btn, Card, Note, StepHeader, Tag, Term } from "../ui";
import { TestTube } from "../viz/TestTube";

export function Setup() {
  const { foodType: sampleType, target, physicalDone } = useWorkspace();
  const mode = useNS((s) => s.mode);
  const rows: [string, React.ReactNode][] = [
    ["Food Sample", sampleType],
    ["Target Adulterant", target],
    ["Detection Method", ASSAY.method],
    [
      "Detection Mode",
      <>
        <Term k="colorimetric">Colorimetric</Term> / Optical
      </>,
    ],
  ];
  return (
    <>
      <StepHeader n={1} title="Demonstration Setup" category="physical" lead="What we test, what we look for, and where the live laboratory part ends." />
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-start gap-5">
            <TestTube colour={ASSAY.colours.positive} className="hidden h-44 w-auto shrink-0 sm:block" bubbles label="illustration" />
            <dl className="grid flex-1 gap-3">
              {rows.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[9.5rem_1fr] items-baseline gap-3 border-b border-ns-line pb-3">
                  <dt className="mono text-[11px] tracking-[0.12em] text-ns-muted uppercase">{k}</dt>
                  <dd className="text-[15px] font-medium">{v}</dd>
                </div>
              ))}
              <div className="grid grid-cols-[9.5rem_1fr] items-center gap-3">
                <dt className="mono text-[11px] tracking-[0.12em] text-ns-muted uppercase">Status</dt>
                <dd>
                  {physicalDone ? (
                    <span className="inline-flex items-center gap-2 rounded-full bg-ns-green/10 px-3 py-1 text-[13px] font-semibold text-ns-green">
                      <CircleCheck className="h-4 w-4" /> Physical Laboratory Test Completed
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-full bg-ns-amber/10 px-3 py-1 text-[13px] font-semibold text-ns-amber">
                      <CircleDashed className="h-4 w-4" /> Physical test pending
                    </span>
                  )}
                </dd>
              </div>
            </dl>
          </div>
        </Card>

        <Card className="flex flex-col border-l-4 !border-l-ns-green p-6">
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-ns-green" />
            <h2 className="text-lg font-semibold">Physical Demonstration</h2>
          </div>
          <p className="mt-3 text-[15px] leading-relaxed text-ns-text2">
            The sample has undergone the laboratory screening procedure. The observed physical/colour response is now used as the starting point for the digital
            detection pipeline.
          </p>
          {mode === "demo" && (
            <p className="mt-2 rounded-lg bg-ns-amber/10 px-3 py-2 text-[12.5px] text-ns-amber">
              Simulation mode: samples, photos and calibration are illustrative. Switch to Real Experiment mode for your laboratory inputs.
            </p>
          )}
          <div className="mt-4">
            {physicalDone ? (
              <span className="mono inline-flex items-center gap-2 rounded-md border border-ns-green/40 bg-ns-green/10 px-3 py-1.5 text-[12px] font-semibold tracking-wider text-ns-green uppercase">
                <span className="h-2 w-2 rounded-full bg-ns-green" /> Physical Reading Available
              </span>
            ) : (
              <span className="mono inline-flex items-center gap-2 rounded-md border border-ns-amber/40 bg-ns-amber/10 px-3 py-1.5 text-[12px] font-semibold tracking-wider text-ns-amber uppercase">
                Physical reading not yet recorded
              </span>
            )}
          </div>
          <div className="mt-auto flex flex-wrap gap-2 pt-6">
            <Btn onClick={() => go("physical")} icon>
              Record Physical Reading
            </Btn>
            <Btn variant="secondary" onClick={() => go("nano")} icon>
              Proceed to Nano-Sensing
            </Btn>
          </div>
        </Card>
      </div>

      <Card className="mt-5 p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold">Assay configuration</h3>
          <Tag c="physical" />
          {!ASSAY.configured && <span className="mono text-[10.5px] tracking-wider text-ns-amber uppercase">not yet configured</span>}
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-[13px] sm:grid-cols-2">
          {(
            [
              ["Assay", ASSAY.assayName],
              ["Recognition", ASSAY.recognition],
              ["Nano-sensing layer", ASSAY.nanoLayer],
              ["Readout", ASSAY.readout],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex gap-2">
              <dt className="w-36 shrink-0 text-ns-muted">{k}</dt>
              <dd className="text-ns-text2">{v}</dd>
            </div>
          ))}
        </dl>
        <Note className="mt-4">
          The chemistry fields stay generic on purpose. They are filled in from the team&apos;s validated laboratory assay in <code className="mono">src/content/nanosense.ts</code>;
          this app does not invent reagents, quantities or a nanoparticle mechanism.
        </Note>
      </Card>
    </>
  );
}
