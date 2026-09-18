"use client";
import { motion } from "motion/react";
import { FSSAI_2425, LAB_LIMITS, NEEDS } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { useSeen } from "@/lib/useInView";

export function Problem() {
  const [ref, seen] = useSeen<HTMLDivElement>();
  const flagged = FSSAI_2425.unsafe + FSSAI_2425.substandard;
  // 100-cell waffle: each cell ≈ 1 % of samples tested
  const cells = Math.round((flagged / FSSAI_2425.tested) * 100);
  return (
    <Section id="problem" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="01"
          eyebrow="The problem"
          title={<>Adulteration hides in staple foods. Testing happens far away.</>}
          lead="Milk, spices, oils and pulses are routinely adulterated in India. Lab testing is accurate, but it's slow, costly and concentrated in a few hundred accredited labs, far from the markets, dairies and kitchens where food is actually bought."
        />
        <div ref={ref} className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
          <div className="rounded-3xl border border-line-2 bg-surface/60 p-6">
            <div className="flex items-baseline justify-between gap-3">
              <div className="eyebrow">FSSAI testing 2024–25</div>
              <EvidenceBadge type="lit" />
            </div>
            <div className="mt-4 grid grid-cols-10 gap-1.5" role="img" aria-label={`${cells} of 100 cells highlighted: unsafe plus substandard samples`}>
              {Array.from({ length: 100 }, (_, i) => (
                <motion.span
                  key={i}
                  className="aspect-square rounded-[3px]"
                  initial={{ background: "var(--line)" }}
                  animate={seen ? { background: i < cells ? (i < Math.round((FSSAI_2425.unsafe / FSSAI_2425.tested) * 100) ? "var(--series-2)" : "var(--series-1)") : "var(--line-2)" } : {}}
                  transition={{ delay: 0.2 + i * 0.008 }}
                />
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-text-2">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: "var(--series-2)" }} /> Unsafe {FSSAI_2425.unsafe.toLocaleString("en-IN")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ background: "var(--series-1)" }} /> Substandard {FSSAI_2425.substandard.toLocaleString("en-IN")}
              </span>
              <span>of {FSSAI_2425.tested.toLocaleString("en-IN")} tested · each cell ≈ 1 %</span>
            </div>
          </div>

          <div className="grid gap-6">
            <div className="grid grid-cols-2 gap-3">
              {LAB_LIMITS.map((l) => (
                <div key={l.v} className="rounded-2xl border border-line-2 bg-surface/60 p-4">
                  <div className="text-2xl font-semibold tracking-tight">{l.k}</div>
                  <div className="mt-1 text-xs text-text-2">{l.v}</div>
                  <div className="mono mt-2 text-[10px] text-muted">{l.ref}</div>
                </div>
              ))}
            </div>
            <ul className="space-y-2">
              {NEEDS.map((n) => (
                <li key={n} className="flex gap-3 text-sm text-text-2">
                  <span className="mt-2 h-1 w-3 shrink-0 bg-nano" />
                  {n}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </Section>
  );
}
