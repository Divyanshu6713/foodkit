"use client";
import dynamic from "next/dynamic";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, Box, ChevronLeft, ChevronRight, MousePointerClick, X } from "lucide-react";
import { BRAND } from "@/content/research";
import { DEVICE_PARTS, getPart, type PartId } from "@/content/device";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { Button } from "@/components/ui/Chip";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { scrollToId } from "@/lib/store";

const HeroScene = dynamic(() => import("./HeroScene"), { ssr: false, loading: () => <CanvasFallback /> });

const STATS = [
  { k: "< 2 min", v: "Colorimetric urea screen", ev: "lit" as const },
  { k: "5", v: "Initial prototype targets", ev: "proposed" as const },
  { k: "4–6", v: "Zones per paper cartridge", ev: "proposed" as const },
  { k: "₹2.5–3.5k", v: "Estimated reader BOM", ev: "proposed" as const },
];

export function Hero() {
  const [explore, setExplore] = useState(false);
  const [selected, setSelected] = useState<PartId | null>(null);
  const [hovered, setHovered] = useState<PartId | null>(null);

  const part = selected ? getPart(selected) : null;
  const idx = selected ? DEVICE_PARTS.findIndex((p) => p.id === selected) : -1;
  const step = (d: number) => setSelected(DEVICE_PARTS[(idx + d + DEVICE_PARTS.length) % DEVICE_PARTS.length].id);
  const focusMode = explore || !!selected;

  return (
    <section id="top" className="relative h-[100svh] min-h-[720px] w-full overflow-hidden">
      {/* backdrop */}
      <div aria-hidden className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_45%,#0f2a2a_0%,#070b0f_45%,#05080b_75%)]" />
      <div aria-hidden className="bg-grid absolute inset-0 opacity-50" />

      <LazyMount className="absolute inset-0" margin="0px">
        <HeroScene explore={explore} selected={selected} hovered={hovered} onHover={setHovered} onSelect={setSelected} />
      </LazyMount>

      {/* copy */}
      <div className="pointer-events-none relative z-10 mx-auto flex h-full max-w-7xl flex-col px-4 pt-24 sm:px-6 lg:justify-center lg:px-8 lg:pt-0">
        <motion.div
          animate={{ opacity: focusMode ? 0 : 1, x: focusMode ? -40 : 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`max-w-xl ${focusMode ? "pointer-events-none" : "pointer-events-auto"}`}
        >
          <div className="eyebrow mb-5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] sm:text-xs">
            <span>Food safety</span>
            <span className="text-muted">×</span>
            <span>Nanotechnology</span>
            <span className="text-muted">×</span>
            <span>Portable diagnostics</span>
          </div>
          <h1 className="text-5xl leading-[0.95] font-semibold tracking-tight sm:text-6xl lg:text-7xl">
            {BRAND.headline.split(" ").map((w, i) => (
              <motion.span
                key={w}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                className={`mr-3 inline-block ${i === 2 ? "bg-gradient-to-r from-nano to-signal bg-clip-text text-transparent" : ""}`}
              >
                {w}
              </motion.span>
            ))}
          </h1>
          <p className="mt-5 text-lg font-medium text-text sm:text-xl">{BRAND.sub}</p>
          <p className="mt-3 max-w-lg text-sm leading-relaxed text-text-2 sm:text-base">{BRAND.description}</p>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Button onClick={() => { setSelected(null); setExplore(true); }}>
              <Box className="h-4 w-4" /> Explore device
            </Button>
            <Button variant="ghost" onClick={() => scrollToId("test")}>
              Test a sample <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted">
            <EvidenceBadge type="proposed" />
            <span>{BRAND.status}. 3D model is a design render.</span>
          </div>
        </motion.div>
      </div>

      {/* stats strip */}
      <motion.div
        animate={{ opacity: focusMode ? 0 : 1, y: focusMode ? 20 : 0 }}
        className="pointer-events-none absolute inset-x-0 bottom-0 z-10 hidden border-t border-line bg-bg/40 backdrop-blur-sm md:block"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-4 divide-x divide-line px-4 sm:px-6 lg:px-8">
          {STATS.map((s) => (
            <div key={s.v} className="flex items-center justify-between gap-3 px-5 py-4 first:pl-0">
              <div>
                <div className="text-xl font-semibold tracking-tight">{s.k}</div>
                <div className="text-xs text-text-2">{s.v}</div>
              </div>
              <EvidenceBadge type={s.ev} />
            </div>
          ))}
        </div>
      </motion.div>

      {/* interaction hint */}
      {!focusMode && (
        <div className="pointer-events-none absolute right-6 bottom-24 z-10 hidden items-center gap-2 text-xs text-muted lg:flex">
          <MousePointerClick className="h-3.5 w-3.5" /> Move the mouse · hover and click parts
        </div>
      )}

      {/* explore toolbar */}
      <AnimatePresence>
        {explore && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="absolute inset-x-0 bottom-6 z-20 mx-auto flex w-fit max-w-[calc(100%-2rem)] flex-wrap items-center justify-center gap-3 rounded-full glass px-4 py-2 text-xs"
          >
            <span className="eyebrow">Exploded view</span>
            <span className="text-text-2">Drag to rotate · click a part</span>
            <button
              type="button"
              onClick={() => { setExplore(false); setSelected(null); }}
              className="flex items-center gap-1 rounded-full border border-line-2 px-2.5 py-1 text-text hover:border-nano hover:text-nano"
            >
              <X className="h-3 w-3" /> Close
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* part info panel */}
      <AnimatePresence>
        {part && (
          <motion.aside
            key={part.id}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 30 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="glass absolute right-4 bottom-4 z-30 w-[calc(100%-2rem)] max-w-sm rounded-2xl p-5 sm:right-6 sm:bottom-6 lg:top-1/2 lg:bottom-auto lg:-translate-y-1/2"
            aria-live="polite"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="eyebrow mb-1">Component {String(idx + 1).padStart(2, "0")} / {DEVICE_PARTS.length}</div>
                <h3 className="text-xl font-semibold">{part.name}</h3>
                <p className="mono mt-1 text-[11px] text-text-2">{part.spec}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setSelected(null)} className="rounded-full p-1 text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="mt-4 space-y-3 text-sm">
              <div>
                <dt className="mono text-[10px] tracking-widest text-muted uppercase">Function</dt>
                <dd className="mt-0.5 text-text">{part.fn}</dd>
              </div>
              <div>
                <dt className="mono text-[10px] tracking-widest text-muted uppercase">Role in detection</dt>
                <dd className="mt-0.5 text-text">{part.role}</dd>
              </div>
              <div>
                <dt className="mono text-[10px] tracking-widest text-muted uppercase">Technical explanation</dt>
                <dd className="mt-0.5 leading-relaxed text-text-2">{part.tech}</dd>
              </div>
            </dl>
            <div className="mt-4 flex items-center justify-between">
              <EvidenceBadge type={part.evidence} long />
              <div className="flex gap-1">
                <button type="button" aria-label="Previous component" onClick={() => step(-1)} className="rounded-full border border-line-2 p-1.5 hover:border-nano hover:text-nano">
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label="Next component" onClick={() => step(1)} className="rounded-full border border-line-2 p-1.5 hover:border-nano hover:text-nano">
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* hover tooltip (desktop) */}
      <AnimatePresence>
        {hovered && hovered !== selected && !explore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mono pointer-events-none absolute top-24 right-6 z-20 rounded-full glass px-3 py-1 text-[11px] tracking-wider text-nano uppercase"
          >
            {getPart(hovered).name} — click to inspect
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
