"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { NOVELTY, PROTOTYPES, RAFT, TECHNOLOGIES } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

export function Landscape() {
  const [open, setOpen] = useState(0);
  const t = TECHNOLOGIES[open];
  return (
    <Section id="landscape" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="14"
          eyebrow="Technology landscape"
          title="Where this fits and what already exists"
          lead="Using nanotechnology doesn't make a product unique. The research surveys eight detection approaches and several existing kits and prototypes, and rates how feasible each one is for a student prototype."
          aside={<EvidenceBadge type="lit" long />}
        />

        <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <ul className="space-y-1.5" role="tablist" aria-label="Detection technologies">
            {TECHNOLOGIES.map((x, i) => (
              <li key={x.name}>
                <button
                  role="tab"
                  aria-selected={open === i}
                  onClick={() => setOpen(i)}
                  onMouseEnter={() => setOpen(i)}
                  className={`flex w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${open === i ? "border-nano bg-nano/10" : "border-line bg-surface/40 hover:border-line-2"}`}
                >
                  <span className="text-sm font-medium">{x.name}</span>
                  <span className="flex items-center gap-2">
                    <span className="flex gap-0.5" aria-hidden>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} className={`h-3 w-1.5 rounded-sm ${x.feasibilityLevel >= n ? "bg-nano" : "bg-line-2"}`} />
                      ))}
                    </span>
                    <span className="mono w-20 text-right text-[10px] text-text-2">{x.feasibility}</span>
                  </span>
                </button>
              </li>
            ))}
            <li className="px-1 pt-1 text-[11px] text-muted">Bars: student-prototype feasibility as rated in the research.</li>
          </ul>

          <AnimatePresence mode="wait">
            <motion.div key={t.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="rounded-3xl border border-line-2 bg-surface/60 p-6">
              <h3 className="text-xl font-semibold">{t.name}</h3>
              <dl className="mt-4 space-y-3 text-sm">
                <Item k="Principle" v={t.principle} />
                <Item k="Targets" v={t.targets} />
                <div>
                  <dt className="mono text-[10px] tracking-widest text-muted uppercase">Reported performance</dt>
                  <dd className="mt-1 space-y-1">
                    {t.performance.map((p) => (
                      <div key={p} className="mono text-xs text-signal">
                        {p}
                      </div>
                    ))}
                  </dd>
                </div>
                <Item k="Cost" v={t.cost} />
                <Item k="Limitations" v={t.limitations} />
                <Item k="Student feasibility" v={t.feasibility} />
              </dl>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* prototypes */}
        <h3 className="mt-16 mb-4 text-lg font-semibold">Recent research prototypes</h3>
        <div className="overflow-x-auto rounded-2xl border border-line-2">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-surface/80 text-xs text-muted">
              <tr>
                {["Prototype", "Targets", "Technology", "LOD", "Time", "Cost", "Limitations"].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROTOTYPES.map((p) => (
                <tr key={p.name} className="border-t border-line align-top">
                  <td className="px-4 py-3 font-medium">{p.name}</td>
                  <td className="px-4 py-3 text-text-2">{p.targets}</td>
                  <td className="px-4 py-3 text-text-2">{p.tech}</td>
                  <td className="mono px-4 py-3 whitespace-nowrap">{p.lod}</td>
                  <td className="mono px-4 py-3 whitespace-nowrap">{p.time}</td>
                  <td className="mono px-4 py-3 whitespace-nowrap">{p.cost}</td>
                  <td className="px-4 py-3 text-text-2">{p.limits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-line-2 bg-surface/60 p-6">
            <div className="eyebrow mb-2">Commercial · FSSAI RAFT kits</div>
            <p className="text-sm text-text">{RAFT.approved}.</p>
            <ul className="mt-3 space-y-1 text-sm text-text-2">
              {RAFT.examples.map((e) => (
                <li key={e}>— {e}</li>
              ))}
            </ul>
            <p className="mt-3 text-sm text-text-2">
              {RAFT.price} · {RAFT.perTest}. Limitation: {RAFT.limits.toLowerCase()}.
            </p>
          </div>
          <div className="rounded-3xl border border-nano/30 bg-nano/5 p-6">
            <div className="eyebrow mb-2">The gap this project targets</div>
            <p className="text-sm text-text">
              The research finds no open-source, multi-adulterant, smartphone-integrated device with &lt; ₹20 per-test consumables.
            </p>
            <ul className="mt-3 space-y-2">
              {NOVELTY.map((n) => (
                <li key={n.title} className="text-sm">
                  <span className="font-medium">{n.title}.</span> <span className="text-text-2">{n.text}</span>
                </li>
              ))}
            </ul>
            <div className="mt-3">
              <EvidenceBadge type="proposed" long />
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <dt className="mono text-[10px] tracking-widest text-muted uppercase">{k}</dt>
      <dd className="mt-0.5 text-text-2">{v}</dd>
    </div>
  );
}
