"use client";
import { go } from "../nav";
import { Btn, Card, Chain, Note, StepHeader, Tag } from "../ui";
import { NanoCanvas } from "../viz/NanoCanvas";
import { TestTube } from "../viz/TestTube";
import { useNanoColours } from "./NanoMechanism";

export function BeforeAfter() {
  const c = useNanoColours();
  const panels = [
    { title: "Before Target Interaction", sub: "Nanoparticles distributed in the sensing medium, in their initial optical state.", phase: 0, tube: c.mediumBefore },
    { title: "After Target Interaction", sub: "Nanoparticles with a changed optical response after meeting the target.", phase: 4, tube: c.mediumAfter },
  ];
  return (
    <>
      <StepHeader n={4} title="Before / After Nano Response" category="concept" lead="The same sensing layer, before and after the target analyte (or its reaction product) interacts with it." />
      <div className="grid gap-5 md:grid-cols-2">
        {panels.map((p, i) => (
          <Card key={p.title} className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-ns-line px-5 py-3">
              <div>
                <div className="mono text-[10px] tracking-[0.14em] text-ns-muted uppercase">{i === 0 ? "Left" : "Right"}</div>
                <h2 className="text-[15px] font-semibold">{p.title}</h2>
              </div>
              <Tag c="concept" />
            </div>
            <div className="relative h-[280px]">
              <NanoCanvas phase={p.phase} {...c} seed={11} />
              <div className="absolute right-3 bottom-3 rounded-xl bg-ns-surface/85 p-2 backdrop-blur">
                <TestTube colour={p.tube} className="h-20 w-auto" label={i === 0 ? "before" : "after"} />
              </div>
            </div>
            <p className="border-t border-ns-line px-5 py-3 text-[13px] text-ns-text2">{p.sub}</p>
          </Card>
        ))}
      </div>
      <Card className="mt-5 p-5">
        <Chain active={2} items={[{ label: "Initial Optical State" }, { label: "Target Interaction" }, { label: "Changed Optical Signal" }]} />
      </Card>
      <Note className="mt-5">
        Both panels are conceptual illustrations drawn with the configured assay colours. The real response is recorded as a photograph in the Physical Test step and
        measured in Photograph Analysis. The exact sensing mechanism depends on the validated assay chemistry.
      </Note>
      <div className="mt-5">
        <Btn onClick={() => go("image")} icon>
          Analyse the photograph
        </Btn>
      </div>
    </>
  );
}
