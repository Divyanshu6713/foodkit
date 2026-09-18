"use client";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { FlaskConical } from "lucide-react";
import { CANDIDATES, TARGETS, getFood, type FoodId, type Target } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button, Chip } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { scrollToId, useDemo } from "@/lib/store";

export function Database() {
  const [filter, setFilter] = useState<FoodId | "all">("all");
  const list = TARGETS.filter((t) => filter === "all" || t.food === filter);
  return (
    <Section id="database" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="13"
          eyebrow="Adulterant database"
          title="The five initial targets"
          lead="The research recommends these targets on scientific feasibility, cost, sample availability, safety and usefulness. Every field below is taken from that recommendation."
          aside={
            <div className="flex gap-2" role="group" aria-label="Filter by food">
              <Chip active={filter === "all"} onClick={() => setFilter("all")}>All</Chip>
              <Chip active={filter === "milk"} onClick={() => setFilter("milk")}>Milk</Chip>
              <Chip active={filter === "turmeric"} onClick={() => setFilter("turmeric")}>Turmeric</Chip>
            </div>
          }
        />
        <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence>
            {list.map((t, i) => (
              <motion.div key={t.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ delay: i * 0.05 }}>
                <TiltCard t={t} />
              </motion.div>
            ))}
          </AnimatePresence>
          {filter === "all" &&
            CANDIDATES.map((c) => (
              <div key={c.name} className="rounded-3xl border border-dashed border-line-2 p-6">
                <div className="mono text-[10px] tracking-widest text-warn uppercase">Candidate · not modelled</div>
                <h3 className="mt-2 text-xl font-semibold">{c.name}</h3>
                <p className="text-sm text-text-2">{c.food}</p>
                <dl className="mt-4 space-y-2 text-sm">
                  <div>
                    <dt className="text-[11px] text-muted">Health concern</dt>
                    <dd>{c.healthConcern}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] text-muted">Status</dt>
                    <dd className="text-text-2">{c.note}</dd>
                  </div>
                </dl>
              </div>
            ))}
        </motion.div>
      </Container>
    </Section>
  );
}

function Meter({ level }: { level: number }) {
  return (
    <span className="flex gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={`h-1.5 w-4 rounded-full ${level >= n ? "bg-nano" : level >= n - 0.5 ? "bg-nano/50" : "bg-line-2"}`} />
      ))}
    </span>
  );
}

function TiltCard({ t }: { t: Target }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0, gx: 50, gy: 50 });
  const pick = useDemo((s) => s.pick);
  const m = t.methods[0];

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current!.getBoundingClientRect();
        const u = (e.clientX - r.left) / r.width;
        const v = (e.clientY - r.top) / r.height;
        setTilt({ x: (0.5 - v) * 8, y: (u - 0.5) * 10, gx: u * 100, gy: v * 100 });
      }}
      onMouseLeave={() => setTilt({ x: 0, y: 0, gx: 50, gy: 50 })}
      style={{ transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`, transition: "transform .15s ease-out" }}
      className="group relative h-full overflow-hidden rounded-3xl border border-line-2 bg-surface/80 p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `radial-gradient(400px circle at ${tilt.gx}% ${tilt.gy}%, color-mix(in oklab, var(--nano) 12%, transparent), transparent 60%)` }}
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mono text-[10px] tracking-widest text-muted uppercase">{getFood(t.food).name}</div>
            <h3 className="mt-1 text-2xl font-semibold">{t.name}</h3>
            <div className="mono text-xs text-text-2">{t.formula}</div>
          </div>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-line-2">
            <span className="h-7 w-7 rounded-full" style={{ background: `linear-gradient(135deg, ${m.colorFrom}, ${m.colorTo})` }} />
          </span>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <Field k="Food" v={t.foodLabel} />
          <Field k="Health concern" v={t.healthConcern} />
          <Field k="Detection principle" v={t.methods.map((x) => x.chemistry).join(" / ")} full />
          <Field k="Signal" v={t.methods.map((x) => x.signal).join(" · ")} />
          <Field k="Approx. range" v={t.range} />
          <Field k="Detection time" v={t.time} />
          <div>
            <dt className="text-[11px] text-muted">Prototype difficulty</dt>
            <dd className="mt-1 flex items-center gap-2">
              <Meter level={t.difficultyLevel} />
              <span className="text-xs">{t.difficulty}</span>
            </dd>
          </div>
          <Field k="Major experimental risk" v={t.risk} full />
        </dl>
        <p className="mt-3 text-[11px] text-muted">{t.healthNote}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <EvidenceBadge type="lit" />
          <Button
            variant="ghost"
            className="!px-3 !py-1.5 text-xs"
            onClick={() => {
              pick(t.food, t.id, m.id);
              scrollToId("test");
            }}
          >
            <FlaskConical className="h-3.5 w-3.5" /> Simulate
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ k, v, full }: { k: string; v: string; full?: boolean }) {
  return (
    <div className={full ? "col-span-2" : ""}>
      <dt className="text-[11px] text-muted">{k}</dt>
      <dd className="mt-0.5 leading-snug">{v}</dd>
    </div>
  );
}
