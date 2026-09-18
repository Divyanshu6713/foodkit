"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, FlaskConical, TriangleAlert } from "lucide-react";
import { FOODS, SCOPE_LABEL, getFood, getTarget, type FoodId, type ScopeStatus, type TargetId } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Chip, Button } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { scrollToId, useDemo } from "@/lib/store";

const SamplesScene = dynamic(() => import("./SamplesScene"), { ssr: false, loading: () => <CanvasFallback /> });

const DOT: Record<ScopeStatus, string> = { prototype: "bg-nano", candidate: "bg-warn", context: "bg-muted" };

export function Samples() {
  const [hovered, setHovered] = useState<FoodId | null>(null);
  const [selected, setSelected] = useState<FoodId | null>("milk");
  const [target, setTarget] = useState<TargetId | null>(null);
  const pick = useDemo((s) => s.pick);

  const food = selected ? getFood(selected) : null;
  const tgt = target ? getTarget(target) : null;
  const preview = hovered && hovered !== selected ? getFood(hovered) : null;

  const select = (id: FoodId) => {
    setSelected(id);
    setTarget(null);
  };

  return (
    <Section id="samples" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="02"
          eyebrow="Sample selection"
          title="What are you testing?"
          lead="These are the foods the research flags as high-risk in India. Hover over a sample, then click it to see its adulterants and which of them the prototype targets."
          aside={
            <ul className="flex flex-col gap-1.5 text-xs text-text-2">
              {(Object.keys(SCOPE_LABEL) as ScopeStatus[]).map((s) => (
                <li key={s} className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${DOT[s]}`} /> {SCOPE_LABEL[s]}
                </li>
              ))}
            </ul>
          }
        />
      </Container>

      <div className="relative">
        <LazyMount className="h-[380px] w-full sm:h-[440px]">
          <SamplesScene hovered={hovered} selected={selected} onHover={setHovered} onSelect={select} />
        </LazyMount>
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="glass pointer-events-none absolute top-4 left-1/2 -translate-x-1/2 rounded-xl px-4 py-2 text-center"
            >
              <div className="text-sm font-medium">{preview.name}</div>
              <div className="text-xs text-text-2">{preview.adulterants.slice(0, 3).join(" · ")}</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Container>
        <div className="mt-2 flex flex-wrap justify-center gap-2" role="group" aria-label="Choose a food sample">
          {FOODS.map((f) => (
            <Chip key={f.id} active={selected === f.id} onClick={() => select(f.id)}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full align-middle ${DOT[f.scope]}`} />
              {f.name}
            </Chip>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {food && (
            <motion.div
              key={food.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="mt-10 grid gap-6 lg:grid-cols-[1.1fr_1fr]"
            >
              {/* food card */}
              <div className="rounded-2xl border border-line-2 bg-surface/70 p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl font-semibold">{food.name}</h3>
                  <span className="mono flex items-center gap-2 rounded-full border border-line-2 px-3 py-1 text-[10px] tracking-widest text-text-2 uppercase">
                    <span className={`h-1.5 w-1.5 rounded-full ${DOT[food.scope]}`} /> {SCOPE_LABEL[food.scope]}
                  </span>
                </div>
                <dl className="mt-5 grid gap-4 sm:grid-cols-2">
                  <div>
                    <dt className="mono text-[10px] tracking-widest text-muted uppercase">Common adulterants</dt>
                    <dd className="mt-1 text-sm">{food.adulterants.join(", ")}</dd>
                  </div>
                  <div>
                    <dt className="mono text-[10px] tracking-widest text-muted uppercase">Health risk</dt>
                    <dd className="mt-1 text-sm">{food.healthRisk}</dd>
                    <dd className="mt-1 flex items-center gap-1.5 text-xs text-warn">
                      <TriangleAlert className="h-3 w-3" /> Risk level: {food.riskLevel}
                    </dd>
                  </div>
                </dl>
                <p className="mt-5 border-t border-line pt-4 text-sm text-text-2">{food.scopeNote}</p>
                <div className="mt-3">
                  <EvidenceBadge type="lit" long />
                </div>
              </div>

              {/* targets */}
              <div className="rounded-2xl border border-line-2 bg-surface/70 p-6">
                <div className="eyebrow mb-3">Prototype targets</div>
                {food.targets.length === 0 ? (
                  <p className="text-sm text-text-2">
                    No simulated test is available for this sample. The research doesn&apos;t give enough chemistry (reagent, range, time) to model it without inventing values.
                  </p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      {food.targets.map((t) => (
                        <Chip key={t} active={target === t} onClick={() => setTarget(t)} className="mono text-xs tracking-wider uppercase">
                          {getTarget(t).name}
                        </Chip>
                      ))}
                    </div>
                    <AnimatePresence mode="wait">
                      {tgt ? (
                        <motion.div key={tgt.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-5 space-y-3 text-sm">
                          <div className="flex items-baseline justify-between gap-2">
                            <span className="text-lg font-semibold">{tgt.name}</span>
                            <span className="mono text-xs text-text-2">{tgt.formula}</span>
                          </div>
                          <Row k="Detection" v={tgt.methods.map((m) => m.chemistry).join(" · ")} />
                          <Row k="Signal" v={tgt.methods.map((m) => m.signal).join(" · ")} />
                          <Row k="Range" v={tgt.range} />
                          <Row k="Time" v={tgt.time} />
                          <Button
                            className="mt-2"
                            onClick={() => {
                              pick(food.id, tgt.id, tgt.methods[0].id);
                              scrollToId("test");
                            }}
                          >
                            <FlaskConical className="h-4 w-4" /> Run a simulated test <ArrowRight className="h-4 w-4" />
                          </Button>
                        </motion.div>
                      ) : (
                        <p className="mt-5 text-sm text-text-2">Select a suspected adulterant to see how the kit would detect it.</p>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </Section>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="grid grid-cols-[88px_1fr] gap-3">
      <span className="mono pt-0.5 text-[10px] tracking-widest text-muted uppercase">{k}</span>
      <span className="text-text-2">{v}</span>
    </div>
  );
}
