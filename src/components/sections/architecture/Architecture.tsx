"use client";
import { Fragment, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Atom, Binary, Cpu, Droplet, FlaskConical, Radio, Smartphone, type LucideIcon } from "lucide-react";
import type { Evidence } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

interface Mod {
  id: string;
  name: string;
  icon: LucideIcon;
  short: string;
  role: string;
  parts: string[];
  ev: Evidence;
}

const MODS: Mod[] = [
  { id: "sample", name: "Sample", icon: Droplet, short: "Milk / turmeric extract", role: "50–100 µL applied with a dropper. Milk may be diluted 1:2 to limit protein interference.", parts: ["Dropper included"], ev: "proposed" },
  { id: "cart", name: "Disposable cartridge", icon: FlaskConical, short: "Paper µPAD, 4–6 zones", role: "Moves the sample by capillary flow and splits it between reagent zones. Disposable strip in a reusable 3D-printed inclined holder.", parts: ["Whatman Grade 4 paper · ₹12", "3D-printed holder · ₹50"], ev: "proposed" },
  { id: "nano", name: "Nano-engineered sensing", icon: Atom, short: "AgNP · AuNP · Ag/GO", role: "Converts the presence of an adulterant into a color change (AgNP / AuNP plasmonics, indicator dyes) or a current (Ag/GO electrocatalysis).", parts: ["Green-synthesised AgNPs", "Ag/GO-modified SPCE · ₹100–200"], ev: "proposed" },
  { id: "detect", name: "Optical / electrochemical detection", icon: Radio, short: "LED + photodiode · potentiostat", role: "Reads the response: LED illumination and photodiode absorbance, a camera image, or electrode current.", parts: ["5 mm white + RGB LEDs · ₹50", "BPW34 / TEMT6000 · ₹30–100", "ADS1115 16-bit ADC · ₹250"], ev: "proposed" },
  { id: "mcu", name: "ESP32 microcontroller", icon: Cpu, short: "Dual-core · Wi-Fi / BT", role: "Sequences the test, samples the ADC and drives display and radio.", parts: ["ESP32 DevKit v1 · ₹500–600"], ev: "proposed" },
  { id: "proc", name: "Data processing", icon: Binary, short: "Calibration → concentration", role: "RGB / grayscale extraction (OpenCV on the phone) or current mapping on the ESP32, then a calibration curve gives concentration → Pass / Fail.", parts: ["Reference color patch", "Per-session auto-calibration"], ev: "proposed" },
  { id: "out", name: "OLED / smartphone", icon: Smartphone, short: "Result + logging", role: "Result on the 0.96\" OLED or the phone app; optional logging to Google Sheets / ThingSpeak.", parts: ['0.96" I²C OLED · ₹200', "MIT App Inventor / Flutter app"], ev: "proposed" },
];

export function Architecture() {
  const [hover, setHover] = useState<number>(-1);
  const sel = hover >= 0 ? MODS[hover] : null;

  return (
    <Section id="system" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="08"
          eyebrow="System architecture"
          title="Seven modules, one signal chain"
          lead="The architecture proposed in the research, drawn as connected hardware modules. Hover or focus a module to see its role; data moves faster through the part of the chain you're inspecting."
          aside={<EvidenceBadge type="proposed" long />}
        />

        <div className="flex flex-col items-stretch lg:flex-row lg:items-center" onMouseLeave={() => setHover(-1)}>
          {MODS.map((m, i) => {
            const Icon = m.icon;
            const active = hover === i;
            const upstream = hover >= 0 && i <= hover;
            return (
              <Fragment key={m.id}>
                <button
                  type="button"
                  onMouseEnter={() => setHover(i)}
                  onFocus={() => setHover(i)}
                  className={`relative flex flex-1 items-center gap-3 rounded-2xl border p-4 text-left transition-all lg:flex-col lg:items-start lg:p-4 ${
                    active ? "border-nano bg-nano/10 shadow-[0_0_40px_-12px_var(--nano)]" : upstream ? "border-nano/40 bg-surface/80" : "border-line-2 bg-surface/60"
                  }`}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${active ? "border-nano text-nano" : "border-line-2 text-text-2"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <span>
                    <span className="mono block text-[10px] tracking-widest text-muted">{String(i + 1).padStart(2, "0")}</span>
                    <span className="block text-sm leading-tight font-medium">{m.name}</span>
                    <span className="mt-0.5 block text-xs text-text-2">{m.short}</span>
                  </span>
                </button>
                {i < MODS.length - 1 && (
                  <>
                    <span className={`wire wire-v mx-auto h-6 w-0.5 lg:hidden ${upstream && i < hover ? "hot" : ""}`} />
                    <span className={`wire hidden h-0.5 w-6 shrink-0 lg:block ${upstream && i < hover ? "hot" : ""}`} />
                  </>
                )}
              </Fragment>
            );
          })}
        </div>

        <div className="mt-8 min-h-[140px] rounded-2xl border border-line-2 bg-surface/50 p-6">
          <AnimatePresence mode="wait">
            {sel ? (
              <motion.div key={sel.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid gap-4 md:grid-cols-[1fr_1fr_auto]">
                <div>
                  <div className="eyebrow mb-1">Role</div>
                  <p className="text-sm text-text">{sel.role}</p>
                </div>
                <div>
                  <div className="eyebrow mb-1">Suggested parts</div>
                  <ul className="space-y-0.5 text-sm text-text-2">
                    {sel.parts.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
                <EvidenceBadge type={sel.ev} />
              </motion.div>
            ) : (
              <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted">
                Hover a module to inspect it.
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </Container>
    </Section>
  );
}
