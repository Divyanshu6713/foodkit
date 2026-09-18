"use client";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { BOM, BOM_TOTAL } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Chip } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";

type Mode = "optical" | "electro" | "power";

interface Comp {
  id: string;
  label: string;
  sub: string;
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  bom?: string;
  dashed?: boolean;
  note?: string;
  modes: Mode[];
}

const COMPS: Comp[] = [
  { id: "optics", label: "LED + photodiode", sub: "white/RGB · BPW34", x: 30, y: 40, w: 190, h: 110, fill: "#14181c", bom: "pd", modes: ["optical"] },
  { id: "cam", label: "ESP32-CAM", sub: "optional · OV2640", x: 270, y: 40, w: 150, h: 80, fill: "#1a2230", bom: "cam", dashed: true, modes: ["optical"] },
  { id: "spce", label: "SPCE electrode", sub: "Ag/GO-modified", x: 30, y: 330, w: 190, h: 110, fill: "#e8eae4", bom: "spce", modes: ["electro"] },
  { id: "pstat", label: "Potentiostat front-end", sub: "open-source design", x: 270, y: 345, w: 150, h: 80, fill: "#1a2230", dashed: true, note: "The research cites open-source Arduino/ESP32 potentiostats (~₹800) but gives no circuit. Shown as a conceptual block.", modes: ["electro"] },
  { id: "adc", label: "ADS1115", sub: "16-bit ADC · I²C", x: 280, y: 190, w: 130, h: 90, fill: "#3a2a73", bom: "adc", modes: ["optical", "electro"] },
  { id: "mcu", label: "ESP32 DevKit v1", sub: "dual-core · Wi-Fi/BT", x: 480, y: 160, w: 210, h: 150, fill: "#121418", bom: "mcu", modes: ["optical", "electro", "power"] },
  { id: "oled", label: 'OLED 0.96"', sub: "128×64 · I²C", x: 760, y: 40, w: 150, h: 95, fill: "#0b0f14", bom: "oled", modes: ["optical", "electro"] },
  { id: "radio", label: "Phone / cloud", sub: "Wi-Fi / BT", x: 760, y: 190, w: 150, h: 90, fill: "#0f1a24", bom: "comm", modes: ["optical", "electro"] },
  { id: "tp", label: "TP4056", sub: "Li-ion charger", x: 480, y: 380, w: 120, h: 70, fill: "#1f4f9c", bom: "bat", modes: ["power"] },
  { id: "bat", label: "18650 cell", sub: "2000 mAh", x: 640, y: 380, w: 270, h: 70, fill: "#1b7488", bom: "bat", modes: ["power"] },
];

interface Trace {
  d: string;
  modes: Mode[];
  label?: string;
  lx?: number;
  ly?: number;
}

const TRACES: Trace[] = [
  { d: "M220 110 H250 V235 H280", modes: ["optical"], label: "analog", lx: 226, ly: 200 },
  { d: "M480 200 H450 V150 H200 V140", modes: ["optical"], label: "LED drive", lx: 330, ly: 145 },
  { d: "M420 80 H450 V180 H480", modes: ["optical"], label: "image", lx: 426, ly: 72 },
  { d: "M220 385 H270", modes: ["electro"] },
  { d: "M345 345 V280", modes: ["electro"], label: "current → V", lx: 352, ly: 318 },
  { d: "M410 235 H480", modes: ["optical", "electro"], label: "I²C", lx: 432, ly: 228 },
  { d: "M690 190 H720 V88 H760", modes: ["optical", "electro"], label: "I²C", lx: 726, ly: 140 },
  { d: "M690 235 H760", modes: ["optical", "electro"], label: "RF", lx: 716, ly: 228 },
  { d: "M600 415 H640", modes: ["power"] },
  { d: "M775 380 V340 H585 V310", modes: ["power"], label: "VIN", lx: 680, ly: 334 },
  { d: "M540 450 V490 H440", modes: ["power"], label: "USB in", lx: 380, ly: 494 },
];

const CHAIN: Record<Mode, string[]> = {
  optical: ["LED lights zone", "Photodiode (analog)", "ADS1115 (ADC)", "ESP32 (processing)", "OLED / phone"],
  electro: ["Ag/GO SPCE", "Potentiostat (current → voltage)", "ADS1115 (ADC)", "ESP32 (processing)", "OLED / phone"],
  power: ["USB", "TP4056 charger", "18650 cell", "ESP32 VIN → rails"],
};

export function Electronics() {
  const [mode, setMode] = useState<Mode>("optical");
  const [hover, setHover] = useState<string | null>(null);
  const hc = hover ? COMPS.find((c) => c.id === hover) : null;
  const hb = hc?.bom ? BOM.find((b) => b.id === hc.bom) : null;

  return (
    <Section id="electronics" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="09"
          eyebrow="Electronics"
          title="Inside the reader"
          lead="A board-level view of the suggested components. Switch the signal path to follow how an optical or electrochemical signal becomes a number, or how the board is powered."
          aside={
            <div className="flex flex-wrap gap-2" role="group" aria-label="Signal path">
              <Chip active={mode === "optical"} onClick={() => setMode("optical")}>Optical path</Chip>
              <Chip active={mode === "electro"} onClick={() => setMode("electro")}>Electrochemical path</Chip>
              <Chip active={mode === "power"} onClick={() => setMode("power")}>Power</Chip>
            </div>
          }
        />

        {/* signal chain */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {CHAIN[mode].map((c, i) => (
            <motion.span key={mode + c} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }} className="flex items-center gap-2">
              <span className="mono rounded-md border border-nano/40 bg-nano/5 px-2.5 py-1 text-[11px] text-nano">{c}</span>
              {i < CHAIN[mode].length - 1 && <span className="text-muted">→</span>}
            </motion.span>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="overflow-x-auto rounded-3xl border border-line-2 bg-[#07130f] p-3">
            <svg viewBox="0 0 940 520" className="min-w-[640px] w-full" role="img" aria-label={`PCB-style diagram, ${mode} path highlighted`}>
              {/* board */}
              <rect x="10" y="10" width="920" height="500" rx="18" fill="#0c2a20" stroke="#1f4a3a" />
              {Array.from({ length: 40 }, (_, i) => (
                <circle key={i} cx={30 + (i % 20) * 46} cy={i < 20 ? 22 : 498} r="3" fill="#c89b3c" opacity="0.5" />
              ))}
              {/* traces */}
              {TRACES.map((t, i) => {
                const on = t.modes.includes(mode);
                return (
                  <g key={i}>
                    <path d={t.d} fill="none" stroke={on ? "#c89b3c" : "#2d4a3c"} strokeWidth={on ? 3 : 2} strokeLinejoin="round" />
                    {on && <path d={t.d} fill="none" stroke={mode === "power" ? "#f2b33d" : "#4fe3c1"} strokeWidth="3" className="flow-dash" strokeLinejoin="round" />}
                    {on && t.label && (
                      <text x={t.lx} y={t.ly} fontSize="10" fill="#9fe8d6" className="mono">
                        {t.label}
                      </text>
                    )}
                  </g>
                );
              })}
              {/* components */}
              {COMPS.map((c) => {
                const on = c.modes.includes(mode);
                const light = c.fill === "#e8eae4";
                return (
                  <g
                    key={c.id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${c.label}: ${c.sub}`}
                    onMouseEnter={() => setHover(c.id)}
                    onMouseLeave={() => setHover(null)}
                    onFocus={() => setHover(c.id)}
                    onBlur={() => setHover(null)}
                    style={{ cursor: "pointer", opacity: on ? 1 : 0.35, transition: "opacity .4s" }}
                  >
                    <rect
                      x={c.x}
                      y={c.y}
                      width={c.w}
                      height={c.h}
                      rx="8"
                      fill={c.fill}
                      stroke={hover === c.id ? "#4fe3c1" : on ? "#4fe3c1" : "#2d4a3c"}
                      strokeOpacity={hover === c.id ? 1 : on ? 0.5 : 1}
                      strokeWidth={hover === c.id ? 2.5 : 1.5}
                      strokeDasharray={c.dashed ? "6 5" : undefined}
                    />
                    {c.id === "mcu" && <rect x={c.x + 120} y={c.y + 20} width="70" height="80" rx="4" fill="#c9ced3" opacity="0.85" />}
                    {c.id === "mcu" && Array.from({ length: 15 }, (_, i) => <rect key={i} x={c.x + 10 + i * 13} y={c.y + c.h - 12} width="6" height="6" fill="#c89b3c" />)}
                    {c.id === "optics" && ["#fff", "#ff5a5a", "#5aff8c", "#5a8cff"].map((col, i) => <circle key={i} cx={c.x + 30 + i * 28} cy={c.y + 40} r="9" fill={col} opacity={mode === "optical" ? 0.95 : 0.4} />)}
                    {c.id === "optics" && <rect x={c.x + 145} y={c.y + 30} width="22" height="20" fill="#6d7f8f" />}
                    {c.id === "spce" && (
                      <g>
                        <circle cx={c.x + 40} cy={c.y + 55} r="16" fill="#15171a" />
                        <path d={`M${c.x + 18} ${c.y + 42} a24 24 0 0 1 44 0`} fill="none" stroke="#3a3d42" strokeWidth="6" />
                        <path d={`M${c.x + 18} ${c.y + 68} a24 24 0 0 0 44 0`} fill="none" stroke="#c7cdd3" strokeWidth="6" />
                      </g>
                    )}
                    {c.id === "oled" && <rect x={c.x + 12} y={c.y + 12} width={c.w - 24} height="40" fill="#02060a" stroke="#1d2a33" />}
                    {c.id === "oled" && (
                      <text x={c.x + 20} y={c.y + 37} fontSize="12" fill="#4fe3c1" className="mono">
                        READY
                      </text>
                    )}
                    <text x={c.x + (c.id === "optics" || c.id === "spce" ? 12 : 12)} y={c.y + c.h - (c.id === "mcu" ? 30 : 26)} fontSize="13" fill={light ? "#1a1f24" : "#e8eef2"} fontWeight="600">
                      {c.label}
                    </text>
                    <text x={c.x + 12} y={c.y + c.h - (c.id === "mcu" ? 16 : 12)} fontSize="10" fill={light ? "#4a525a" : "#a7b4bf"} className="mono">
                      {c.sub}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="rounded-2xl border border-line-2 bg-surface/60 p-5">
            <AnimatePresence mode="wait">
              {hc ? (
                <motion.div key={hc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
                  <h3 className="text-lg font-semibold">{hc.label}</h3>
                  {hb && (
                    <dl className="space-y-2 text-sm">
                      <div>
                        <dt className="mono text-[10px] tracking-widest text-muted uppercase">Suggested part</dt>
                        <dd>{hb.part}</dd>
                      </div>
                      <div>
                        <dt className="mono text-[10px] tracking-widest text-muted uppercase">Approx. price</dt>
                        <dd>{hb.price}</dd>
                      </div>
                      <div>
                        <dt className="mono text-[10px] tracking-widest text-muted uppercase">Notes</dt>
                        <dd className="text-text-2">{hb.notes}</dd>
                      </div>
                    </dl>
                  )}
                  {hc.note && <p className="text-sm text-text-2">{hc.note}</p>}
                  <EvidenceBadge type={hc.dashed ? "concept" : "proposed"} long />
                </motion.div>
              ) : (
                <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-sm text-muted">
                  Hover or tab to a component for its part number and price. Dashed outlines mark optional or conceptual blocks.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BOM */}
        <div className="mt-10 overflow-x-auto rounded-2xl border border-line-2">
          <table className="w-full min-w-[640px] text-left text-sm">
            <caption className="caption-bottom border-t border-line px-4 py-3 text-left text-xs text-text-2">
              Suggested components and approximate INR prices from vendor listings cited in the research. Total {BOM_TOTAL}. <EvidenceBadge type="lit" className="ml-1" />
            </caption>
            <thead className="bg-surface/80 text-xs text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Component</th>
                <th className="px-4 py-3 font-medium">Suggestion</th>
                <th className="px-4 py-3 font-medium">Approx. price</th>
                <th className="px-4 py-3 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {BOM.map((b) => (
                <tr key={b.id} className="border-t border-line">
                  <td className="px-4 py-2.5 text-text">{b.component}</td>
                  <td className="px-4 py-2.5 text-text-2">{b.part}</td>
                  <td className="mono px-4 py-2.5 whitespace-nowrap">{b.price}</td>
                  <td className="px-4 py-2.5 text-text-2">{b.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </Section>
  );
}
