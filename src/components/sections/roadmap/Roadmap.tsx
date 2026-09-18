"use client";
import { motion } from "motion/react";
import { ShieldAlert } from "lucide-react";
import { BUDGET, RISKS, ROADMAP } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { useSeen } from "@/lib/useInView";

export function Roadmap() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  return (
    <Section id="roadmap" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="15"
          eyebrow="Plan"
          title="From literature to a working prototype"
          lead={`The experimental roadmap proposed in the research: 6–12 months, with an estimated budget of ${BUDGET}.`}
          aside={<EvidenceBadge type="proposed" long />}
        />

        <div ref={ref} className="overflow-x-auto rounded-3xl border border-line-2 bg-surface/60 p-5 sm:p-6">
          <div className="min-w-[720px]">
            <div className="mb-3 grid grid-cols-[220px_repeat(12,1fr)] gap-1 text-center">
              <span />
              {Array.from({ length: 12 }, (_, i) => (
                <span key={i} className="mono text-[10px] text-muted">
                  M{i + 1}
                </span>
              ))}
            </div>
            {ROADMAP.map((r, i) => (
              <div key={r.phase} className="group grid grid-cols-[220px_repeat(12,1fr)] items-center gap-1 border-t border-line py-2.5">
                <div className="pr-3">
                  <div className="text-sm font-medium">{r.phase}</div>
                  <div className="text-[11px] text-text-2">{r.text}</div>
                </div>
                <div className="relative col-span-12 h-7" style={{ gridColumn: "2 / span 12" }}>
                  <motion.div
                    className="absolute top-1 h-5 rounded-md bg-nano/80 group-hover:bg-nano"
                    style={{ left: `${((r.m[0] - 1) / 12) * 100}%` }}
                    initial={{ width: 0 }}
                    animate={seen ? { width: `${((r.m[1] - r.m[0] + 1) / 12) * 100}%` } : {}}
                    transition={{ duration: 0.7, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <span className="mono absolute inset-0 flex items-center px-2 text-[10px] whitespace-nowrap text-bg">{r.when}</span>
                  </motion.div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <h3 className="mt-16 mb-4 flex items-center gap-2 text-lg font-semibold">
          <ShieldAlert className="h-5 w-5 text-warn" /> Key risks and mitigations
        </h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {RISKS.map((r) => (
            <div key={r.risk} className="rounded-2xl border border-line-2 bg-surface/60 p-5">
              <div className="text-sm font-medium text-warn">{r.risk}</div>
              <div className="mt-2 text-sm text-text-2">{r.mitigation}</div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}
