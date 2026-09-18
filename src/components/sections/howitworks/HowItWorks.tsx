"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "motion/react";
import type { Evidence } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

const STEPS: { title: string; text: string; detail: string; ev: Evidence }[] = [
  { title: "Sample", text: "Food sample enters the cartridge.", detail: "50–100 µL of milk, or a turmeric water extract, is dropped into the inlet with the supplied dropper. Milk may be diluted 1:2 with water to reduce protein interference.", ev: "proposed" },
  { title: "Flow", text: "The sample travels through the microfluidic pathway.", detail: "Capillary action pulls it through hydrophilic paper channels. The holder's incline adds gravity-assisted flow, so no pump or power is needed.", ev: "proposed" },
  { title: "Sensing", text: "The sample reaches the nano-engineered sensing zones.", detail: "Each zone holds a dried reagent, such as AgNPs, p-DMAB, bromothymol blue, iodine–KI or guaiacol + peroxidase, plus a negative-control zone.", ev: "proposed" },
  { title: "Signal", text: "Chemical interaction creates an optical or electrochemical response.", detail: "Colorimetric zones change color (e.g. AgNP aggregation shifts the plasmon peak). In electrochemical mode, urea oxidation on Ag/GO produces a current.", ev: "lit" },
  { title: "Processing", text: "Electronics capture the signal.", detail: "An LED lights the zone and a BPW34 / TEMT6000 photodiode reads it, or a phone / ESP32-CAM image is captured. The ADS1115 digitises small signals at 16-bit.", ev: "proposed" },
  { title: "Analysis", text: "Software interprets the signal.", detail: "RGB or grayscale values are corrected against the on-strip reference patch, then a calibration curve maps them to a concentration.", ev: "proposed" },
  { title: "Result", text: "The user receives an understandable result.", detail: "Pass / fail against the reference limit plus a numeric value, on the OLED or the phone, optionally logged to Google Sheets / ThingSpeak.", ev: "proposed" },
];

export function HowItWorks() {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);

  useEffect(() => {
    const io = new IntersectionObserver(
      (es) => {
        es.forEach((e) => {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.i));
        });
      },
      // activation line below the sticky schematic (which covers the top ~45% on phones)
      { rootMargin: "-62% 0px -33% 0px" },
    );
    refs.current.forEach((r) => r && io.observe(r));
    return () => io.disconnect();
  }, []);

  return (
    <Section id="how" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="07"
          eyebrow="How it works"
          title="Seven steps from sample to answer"
          lead="Scroll through the proposed workflow. The schematic follows each step as the sample goes from the inlet to the phone."
        />
        <div className="grid gap-10 lg:grid-cols-2">
          <div className="sticky top-16 z-10 h-[40vh] rounded-3xl border border-line-2 bg-bg/90 p-3 backdrop-blur lg:top-24 lg:h-[70vh] lg:bg-surface/60">
            <Schematic step={active} />
          </div>
          <ol className="relative">
            {STEPS.map((s, i) => (
              <li
                key={s.title}
                data-i={i}
                ref={(el) => {
                  refs.current[i] = el;
                }}
                className="flex min-h-[75vh] items-end pb-10 lg:min-h-[70vh] lg:items-center lg:pb-0"
              >
                <motion.div
                  animate={{ opacity: active === i ? 1 : 0.35, x: active === i ? 0 : 12 }}
                  transition={{ duration: 0.4 }}
                  className="max-w-md"
                >
                  <div className="mono text-5xl font-semibold text-nano/90 sm:text-6xl">{String(i + 1).padStart(2, "0")}</div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{s.title}</h3>
                  <p className="mt-2 text-lg text-text">{s.text}</p>
                  <p className="mt-3 text-sm leading-relaxed text-text-2">{s.detail}</p>
                  <div className="mt-4">
                    <EvidenceBadge type={s.ev} long />
                  </div>
                </motion.div>
              </li>
            ))}
          </ol>
        </div>
      </Container>
    </Section>
  );
}

/* ------------------------------------------------------------------ */

function Schematic({ step }: { step: number }) {
  const on = (s: number | number[]) => (Array.isArray(s) ? s.includes(step) : s === step);
  const op = (s: number | number[]) => (on(s) ? 1 : 0.22);
  const reacted = step >= 3;
  return (
    <svg viewBox="0 0 600 560" className="h-full w-full" role="img" aria-label={`Schematic, step ${step + 1}: ${STEPS[step].title}`}>
      <defs>
        <radialGradient id="zoneGlow">
          <stop offset="0%" stopColor="#4fe3c1" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#4fe3c1" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="ray" x1="0" x2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#6aa8ff" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      {/* ---------------- strip ---------------- */}
      <g opacity={op([0, 1, 2, 3])} style={{ transition: "opacity .5s" }}>
        <rect x="50" y="60" width="120" height="440" rx="10" fill="#26303c" stroke="var(--line-2)" />
        <line x1="110" y1="450" x2="110" y2="170" stroke="#f4f2eb" strokeWidth="16" strokeLinecap="round" />
        <circle cx="110" cy="450" r="24" fill="#f4f2eb" />
        <circle cx="110" cy="170" r="30" fill="#f4f2eb" />
        {/* wet channel */}
        <motion.line
          x1="110"
          y1="450"
          x2="110"
          y2="170"
          stroke="#d9d2bd"
          strokeWidth="11"
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: step >= 1 ? 1 : 0 }}
          transition={{ duration: step === 1 ? 2.2 : 0.3, ease: "easeInOut" }}
        />
        {step >= 0 && <circle cx="110" cy="450" r="18" fill="#d9d2bd" />}
        {/* sensing zone */}
        <motion.circle
          cx="110"
          cy="170"
          r="26"
          initial={false}
          animate={{ fill: reacted ? "#5b6f9e" : step >= 2 ? "#e9c64a" : "#f3efd9" }}
          transition={{ duration: 1.2 }}
        />
        {step === 2 && <circle cx="110" cy="170" r="60" fill="url(#zoneGlow)" />}
        {step === 2 &&
          Array.from({ length: 10 }, (_, i) => (
            <motion.circle
              key={i}
              r="3.5"
              fill="#dfe5ec"
              initial={{ cx: 110 + Math.cos(i) * 16, cy: 170 + Math.sin(i * 1.7) * 16 }}
              animate={{ cx: [110 + Math.cos(i) * 16, 110 + Math.cos(i + 1) * 14], cy: [170 + Math.sin(i * 1.7) * 16, 170 + Math.sin(i * 1.7 + 1) * 14] }}
              transition={{ duration: 2, repeat: Infinity, repeatType: "mirror" }}
            />
          ))}
        <text x="110" y="528" textAnchor="middle" fontSize="12" fill="var(--muted)" className="mono">
          paper cartridge
        </text>
      </g>

      {/* droplet */}
      {step === 0 && (
        <motion.path
          d="M110 360 q -12 18 0 26 q 12 -8 0 -26 z"
          fill="#f7f5ee"
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: [-60, 60], opacity: [0, 1, 1, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeIn" }}
        />
      )}

      {/* ---------------- optics ---------------- */}
      <g opacity={op([3, 4])} style={{ transition: "opacity .5s" }}>
        <rect x="222" y="110" width="44" height="28" rx="6" fill="#14181c" stroke="var(--line-2)" />
        <circle cx="244" cy="124" r="7" fill="#fff" />
        <text x="244" y="100" textAnchor="middle" fontSize="11" fill="var(--text-2)" className="mono">LED</text>
        <rect x="222" y="206" width="44" height="28" rx="6" fill="#14181c" stroke="var(--line-2)" />
        <rect x="236" y="213" width="16" height="14" fill="#6d7f8f" />
        <text x="244" y="254" textAnchor="middle" fontSize="11" fill="var(--text-2)" className="mono">photodiode</text>
        <path d="M222 128 L140 164" stroke="url(#ray)" strokeWidth="3" className={step >= 3 ? "flow-dash" : ""} />
        <path d="M140 176 L222 218" stroke="#6aa8ff" strokeWidth="3" strokeOpacity={step >= 3 ? 0.9 : 0.3} className={step >= 3 ? "flow-dash" : ""} />
      </g>

      {/* ---------------- electronics ---------------- */}
      <g opacity={op(4)} style={{ transition: "opacity .5s" }}>
        <path d="M266 220 L330 220" stroke="var(--nano)" strokeWidth="2" className="flow-dash" />
        <rect x="330" y="195" width="80" height="50" rx="6" fill="#3a2a73" stroke="var(--line-2)" />
        <text x="370" y="225" textAnchor="middle" fontSize="11" fill="#fff" className="mono">ADS1115</text>
        <path d="M410 220 L450 220" stroke="var(--nano)" strokeWidth="2" className="flow-dash" />
        <rect x="450" y="185" width="110" height="70" rx="8" fill="#121418" stroke="var(--nano)" strokeOpacity={on(4) ? 1 : 0.3} />
        <rect x="490" y="195" width="40" height="50" fill="#c9ced3" opacity="0.8" />
        <text x="505" y="275" textAnchor="middle" fontSize="11" fill="var(--text-2)" className="mono">ESP32</text>
      </g>

      {/* ---------------- phone ---------------- */}
      <g opacity={op([5, 6])} style={{ transition: "opacity .5s" }}>
        <path d="M505 255 L505 300" stroke="var(--signal)" strokeWidth="2" className="flow-dash" />
        <rect x="430" y="300" width="150" height="240" rx="18" fill="#0b1015" stroke="var(--line-2)" />
        <rect x="442" y="316" width="126" height="206" rx="8" fill="#0f171f" />
        {step === 5 && (
          <g>
            <line x1="456" y1="500" x2="556" y2="500" stroke="var(--line-2)" />
            <line x1="456" y1="500" x2="456" y2="340" stroke="var(--line-2)" />
            <motion.path d="M456 495 Q 500 470 520 400 T 556 350" fill="none" stroke="var(--nano)" strokeWidth="2" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
            <circle cx="523" cy="392" r="5" fill="var(--warn)" />
            <text x="456" y="332" fontSize="10" fill="var(--text-2)" className="mono">calibration</text>
          </g>
        )}
        {step === 6 && (
          <g>
            <text x="505" y="370" textAnchor="middle" fontSize="11" fill="var(--warn)" className="mono">SIMULATED</text>
            <circle cx="505" cy="420" r="30" fill="none" stroke="var(--bad)" strokeWidth="3" />
            <text x="505" y="426" textAnchor="middle" fontSize="16" fill="var(--bad)" fontWeight="600">!</text>
            <text x="505" y="480" textAnchor="middle" fontSize="12" fill="var(--text)">Urea above limit</text>
          </g>
        )}
        {step < 5 && (
          <text x="505" y="425" textAnchor="middle" fontSize="11" fill="var(--muted)" className="mono">
            phone / OLED
          </text>
        )}
      </g>

      <text x="300" y="30" textAnchor="middle" fontSize="13" fill="var(--nano)" className="mono">
        {String(step + 1).padStart(2, "0")} · {STEPS[step].title.toUpperCase()}
      </text>
    </svg>
  );
}
