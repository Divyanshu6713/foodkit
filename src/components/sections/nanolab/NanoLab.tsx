"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Play, RotateCcw } from "lucide-react";
import { NANOMATERIALS, type NanoId } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { LEGENDS } from "@/components/nano/NanoWorld";

const NanoLabScene = dynamic(() => import("./NanoLabScene"), { ssr: false, loading: () => <CanvasFallback /> });

const SEQ = ["Target analyte", "Nano-sensing surface", "Signal change", "Detection"];
const AT = [0, 0.4, 0.55, 0.85];

export function NanoLab() {
  const inScope = NANOMATERIALS.filter((n) => n.inScope);
  const [id, setId] = useState<NanoId>("agnp");
  const [playKey, setPlayKey] = useState(0);
  const [p, setP] = useState(0);
  const mat = NANOMATERIALS.find((n) => n.id === id)!;
  const zno = NANOMATERIALS.find((n) => n.id === "zno")!;
  const stage = playKey === 0 ? -1 : AT.reduce((a, t, i) => (p >= t ? i : a), 0);

  const choose = (n: NanoId) => {
    setId(n);
    setPlayKey(0);
    setP(0);
  };

  return (
    <Section id="nano" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="05"
          eyebrow="Nanotechnology"
          title={<>Why &ldquo;nano-engineered&rdquo;?</>}
          lead="Each nanomaterial in the research plays a different part: a color reporter, a catalyst, or a better electrode surface. Pick one, then run the interaction to see the mechanism that links it to a measurable signal."
        />

        <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
          <div className="flex flex-col gap-2" role="tablist" aria-label="Nanomaterials">
            {inScope.map((n) => (
              <button
                key={n.id}
                role="tab"
                aria-selected={id === n.id}
                onClick={() => choose(n.id)}
                className={`group rounded-2xl border p-4 text-left transition-all ${id === n.id ? "border-nano bg-nano/10" : "border-line-2 bg-surface/50 hover:border-nano/50"}`}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-lg font-semibold">{n.short}</span>
                  <span className="mono text-[10px] text-muted">{n.cost}</span>
                </div>
                <div className="text-sm text-text-2">{n.name}</div>
                <div className={`mt-1 text-xs ${id === n.id ? "text-nano" : "text-muted"}`}>{n.usedFor}</div>
              </button>
            ))}
            <div className="rounded-2xl border border-dashed border-line-2 p-4 text-xs text-muted">
              <span className="font-medium text-text-2">{zno.short}</span>: {zno.role}. {zno.usedFor}.
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
            <div className="relative h-[420px] overflow-hidden rounded-3xl border border-line-2 bg-[radial-gradient(ellipse_at_50%_40%,#0e2426,#05080b_75%)] sm:h-[520px]">
              <LazyMount className="absolute inset-0">
                <NanoLabScene mode={mat.nanoMode!} goOnly={id === "go"} playKey={playKey} onProgress={setP} />
              </LazyMount>
              <div className="pointer-events-none absolute top-3 left-3 space-y-1 rounded-xl bg-bg/60 p-3 backdrop-blur">
                {LEGENDS[id === "go" ? "go" : mat.nanoMode!].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[11px] text-text-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
                  </div>
                ))}
              </div>
              <div className="pointer-events-none absolute top-3 right-3">
                <EvidenceBadge type="concept" />
              </div>
              <div className="absolute inset-x-3 bottom-3 flex flex-col items-center gap-3">
                <div className="flex flex-wrap items-center justify-center gap-1">
                  {SEQ.map((s, i) => (
                    <div key={s} className="flex items-center gap-1">
                      <span
                        className={`mono rounded-full border px-2.5 py-1 text-[10px] tracking-wider uppercase transition-colors ${
                          i === stage ? "border-nano bg-nano/20 text-nano" : i < stage ? "border-line-2 text-text-2" : "border-line bg-bg/50 text-muted"
                        }`}
                      >
                        {s}
                      </span>
                      {i < SEQ.length - 1 && <ArrowRight className="h-3 w-3 text-muted" />}
                    </div>
                  ))}
                </div>
                <Button onClick={() => setPlayKey((k) => k + 1)}>
                  {playKey ? <RotateCcw className="h-4 w-4" /> : <Play className="h-4 w-4" />} {playKey ? "Replay interaction" : "Run interaction"}
                </Button>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                <div>
                  <div className="eyebrow mb-1">{mat.short}</div>
                  <h3 className="text-xl font-semibold">{mat.name}</h3>
                </div>
                <Info k="Role in sensing" v={mat.role} />
                <Info k="Mechanism" v={mat.mechanism} />
                <Info k="Synthesis" v={mat.synthesis} />
                {mat.protocol && (
                  <div>
                    <div className="mono mb-1.5 text-[10px] tracking-widest text-muted uppercase">Student-friendly protocol</div>
                    <ol className="space-y-1.5">
                      {mat.protocol.map((s, i) => (
                        <li key={i} className="flex gap-2 text-sm text-text-2">
                          <span className="mono text-nano">{String(i + 1).padStart(2, "0")}</span>
                          {s}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                <div className="rounded-xl border border-line bg-bg/40 p-3">
                  <div className="mono mb-2 text-[10px] tracking-widest text-muted uppercase">Detection sequence</div>
                  <ol className="space-y-1">
                    {mat.sequence.map((s, i) => (
                      <li key={i} className={`text-xs ${i === stage ? "text-nano" : "text-text-2"}`}>
                        {SEQ[i]}: {s}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EvidenceBadge type="lit" long />
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Info({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="mono text-[10px] tracking-widest text-muted uppercase">{k}</div>
      <p className="mt-0.5 text-sm leading-relaxed text-text-2">{v}</p>
    </div>
  );
}
