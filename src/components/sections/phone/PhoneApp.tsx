"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Activity, Camera, CircleCheck, CircleX, History, Play, SlidersHorizontal, FileCheck2 } from "lucide-react";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button } from "@/components/ui/Chip";
import { EvidenceBadge } from "@/components/ui/EvidenceBadge";
import { CHEMS, colorAt, estimate, fmt, rgbAt } from "@/lib/colorimetry";
import { DATA_PROCESSING } from "@/content/research";

type Tab = "scan" | "analyze" | "result" | "history" | "calibration";
const TABS: { id: Tab; label: string; icon: typeof Camera }[] = [
  { id: "scan", label: "Scan", icon: Camera },
  { id: "analyze", label: "Analyze", icon: Activity },
  { id: "result", label: "Result", icon: FileCheck2 },
  { id: "history", label: "History", icon: History },
  { id: "calibration", label: "Calibrate", icon: SlidersHorizontal },
];

/** A fixed simulated sample: urea + starch present, others absent. */
const SIM = [
  { target: "urea", c: 13 },
  { target: "detergent", c: 0 },
  { target: "starch", c: 0.8 },
  { target: "h2o2", c: 0 },
] as const;

export function PhoneApp() {
  const [tab, setTab] = useState<Tab>("scan");
  const [running, setRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>[]>([]);

  const zones = useMemo(
    () =>
      SIM.map((s) => {
        const chem = CHEMS.find((c) => c.target === s.target)!;
        const rgb = rgbAt(chem, s.c);
        const est = estimate(chem, rgb);
        const flagged = est >= chem.threshold;
        return { chem, rgb, est, flagged, color: colorAt(chem, s.c) };
      }),
    [],
  );

  const simulate = () => {
    timer.current.forEach(clearTimeout);
    setRunning(true);
    setTab("scan");
    timer.current = [
      setTimeout(() => setTab("analyze"), 2600),
      setTimeout(() => setTab("calibration"), 5000),
      setTimeout(() => {
        setTab("result");
        setRunning(false);
      }, 7400),
    ];
  };
  useEffect(() => () => timer.current.forEach(clearTimeout), []);

  return (
    <Section id="phone" className="py-24 md:py-32" grid>
      <Container>
        <SectionHeader
          index="10"
          eyebrow="Smartphone integration"
          title="The phone does the numbers"
          lead="In image-based mode, a phone app (OpenCV) reads the strip. It extracts RGB from every zone, corrects them against the reference patch, maps them through a calibration curve, and reports a concentration plus pass or fail."
        />
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_380px]">
          <div className="space-y-6">
            <ol className="grid gap-3 sm:grid-cols-2">
              {["RGB extraction", "Calibration curve", "Concentration estimate", "Result"].map((s, i) => {
                const activeIdx = tab === "scan" ? 0 : tab === "analyze" ? 0 : tab === "calibration" ? 1 : tab === "result" ? 3 : -1;
                const on = running ? i <= activeIdx : tab === "result" || i === activeIdx;
                return (
                  <li key={s} className={`rounded-xl border p-4 transition-colors ${on ? "border-nano/60 bg-nano/5" : "border-line-2 bg-surface/50"}`}>
                    <div className="mono text-[10px] text-muted">{String(i + 1).padStart(2, "0")}</div>
                    <div className="text-sm font-medium">{s}</div>
                  </li>
                );
              })}
            </ol>
            <dl className="space-y-3">
              {DATA_PROCESSING.map((d) => (
                <div key={d.mode} className="grid grid-cols-[110px_1fr] gap-3 text-sm">
                  <dt className="mono text-[11px] tracking-wider text-muted uppercase">{d.mode}</dt>
                  <dd className="text-text-2">{d.text}</dd>
                </div>
              ))}
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={simulate} disabled={running}>
                <Play className="h-4 w-4" /> {running ? "Scanning…" : "Simulate a phone scan"}
              </Button>
              <EvidenceBadge type="sim" long />
            </div>
            <p className="text-xs text-muted">App stack suggested in the research: MIT App Inventor or Flutter, with Python / OpenCV image analysis. The screens here are a concept mock-up.</p>
          </div>

          {/* phone */}
          <div className="mx-auto w-[300px] rounded-[44px] border border-line-2 bg-[#0b0f14] p-3 shadow-[0_40px_100px_-30px_rgba(79,227,193,0.35)]">
            <div className="relative h-[600px] overflow-hidden rounded-[34px] bg-[#070b10]">
              <div className="absolute top-2 left-1/2 z-20 h-6 w-24 -translate-x-1/2 rounded-full bg-black" />
              <div className="flex items-center justify-between px-6 pt-3 text-[10px] text-text-2">
                <span>9:41</span>
                <span className="mono text-warn">DEMO</span>
              </div>
              <div className="px-4 pt-6">
                <div className="flex items-center justify-between">
                  <div className="text-base font-semibold">{TABS.find((t) => t.id === tab)!.label}</div>
                  <span className="mono text-[9px] text-muted">NanoFood · BT linked</span>
                </div>
              </div>
              <div className="relative mt-3 h-[470px] px-4">
                <AnimatePresence mode="wait">
                  <motion.div key={tab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="h-full">
                    {tab === "scan" && <ScanScreen zones={zones} scanning={running} />}
                    {tab === "analyze" && <AnalyzeScreen zones={zones} />}
                    {tab === "calibration" && <CalibScreen />}
                    {tab === "result" && <ResultScreen zones={zones} />}
                    {tab === "history" && <HistoryScreen />}
                  </motion.div>
                </AnimatePresence>
              </div>
              <nav className="absolute inset-x-0 bottom-0 grid grid-cols-5 border-t border-line bg-[#0a0f14] px-1 pt-2 pb-4">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`flex flex-col items-center gap-1 text-[9px] ${tab === t.id ? "text-nano" : "text-muted"}`}>
                      <Icon className="h-4 w-4" />
                      {t.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </Container>
    </Section>
  );
}

type Zones = { chem: (typeof CHEMS)[number]; rgb: [number, number, number]; est: number; flagged: boolean; color: string }[];

function ScanScreen({ zones, scanning }: { zones: Zones; scanning: boolean }) {
  return (
    <div className="relative h-full overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_50%_40%,#2b2f33,#0d1013)]">
      <div className="absolute top-1/2 left-1/2 h-[360px] w-[120px] -translate-x-1/2 -translate-y-1/2 rotate-[-4deg] rounded-md bg-[#26303c] shadow-2xl">
        <div className="absolute inset-y-8 left-1/2 w-3 -translate-x-1/2 bg-[#dcd6c4]" />
        {[
          [0.27, 0.47],
          [0.73, 0.47],
          [0.27, 0.27],
          [0.73, 0.27],
        ].map(([u, v], i) => (
          <div key={i}>
            <div className="absolute h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-full" style={{ left: `${u * 100}%`, top: `${v * 100}%`, background: zones[i].color }} />
            <motion.div
              className="absolute h-12 w-12 -translate-x-1/2 -translate-y-1/2 rounded-md border-2 border-nano"
              style={{ left: `${u * 100}%`, top: `${v * 100}%` }}
              initial={{ opacity: 0, scale: 1.4 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 + i * 0.25 }}
            />
          </div>
        ))}
        <div className="absolute top-[8%] left-1/2 h-8 w-8 -translate-x-1/2 rounded-full bg-[#dcd6c4]" />
        <div className="absolute inset-x-2 bottom-2 flex gap-0.5">
          {["#fff", "#bdbdbd", "#6e6e6e", "#1d1d1d", "#d8403a", "#3ba55b", "#3a6fd8"].map((c) => (
            <span key={c} className="h-3 flex-1" style={{ background: c }} />
          ))}
        </div>
      </div>
      {scanning && <div className="absolute inset-x-0 h-24 bg-gradient-to-b from-transparent via-nano/30 to-transparent" style={{ animation: "scanline 1.6s linear infinite" }} />}
      {["top-3 left-3 border-t-2 border-l-2", "top-3 right-3 border-t-2 border-r-2", "bottom-3 left-3 border-b-2 border-l-2", "bottom-3 right-3 border-b-2 border-r-2"].map((c) => (
        <span key={c} className={`absolute h-6 w-6 border-nano ${c}`} />
      ))}
      <div className="mono absolute inset-x-0 bottom-4 text-center text-[10px] text-nano">4 zones · reference patch found</div>
    </div>
  );
}

function AnalyzeScreen({ zones }: { zones: Zones }) {
  return (
    <div className="space-y-3">
      {zones.map((z) => (
        <div key={z.chem.target} className="rounded-xl border border-line bg-surface/60 p-3">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2 text-xs">
              <span className="h-4 w-4 rounded" style={{ background: z.color }} /> {z.chem.name}
            </span>
            <span className="mono text-[10px] text-text-2">
              {z.rgb[0]}/{z.rgb[1]}/{z.rgb[2]}
            </span>
          </div>
          <div className="mt-2 space-y-1">
            {["#ff6b6b", "#5be38a", "#6aa8ff"].map((c, i) => (
              <motion.div key={c} className="h-1 rounded-full" style={{ background: c }} initial={{ width: 0 }} animate={{ width: `${(z.rgb[i] / 255) * 100}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
            ))}
          </div>
        </div>
      ))}
      <p className="mono text-center text-[9px] text-warn">Simulated values</p>
    </div>
  );
}

function CalibScreen() {
  const chem = CHEMS[0];
  const W = 250;
  const H = 180;
  const X = (c: number) => 24 + (c / chem.max) * (W - 34);
  // blue-channel drop as the calibration signal
  const b0 = rgbAt(chem, 0)[2];
  const sig = (c: number) => Math.abs(rgbAt(chem, c)[2] - b0);
  const smax = sig(chem.max) || 1;
  const Y = (v: number) => H - 20 - (v / smax) * (H - 36);
  const pts = Array.from({ length: 41 }, (_, i) => (i / 40) * chem.max);
  const stds = [0, 3, 6, 9, 12, 15];
  const m = 13;
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line bg-surface/60 p-3">
        <div className="mb-1 text-xs">Urea calibration · blue-channel shift</div>
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
          <line x1="24" x2={W - 10} y1={H - 20} y2={H - 20} stroke="var(--line-2)" />
          <line x1="24" x2="24" y1="10" y2={H - 20} stroke="var(--line-2)" />
          <motion.path
            d={pts.map((c, i) => `${i ? "L" : "M"}${X(c)},${Y(sig(c))}`).join(" ")}
            fill="none"
            stroke="var(--nano)"
            strokeWidth="2"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2 }}
          />
          {stds.map((c) => (
            <circle key={c} cx={X(c)} cy={Y(sig(c))} r="3.5" fill="var(--bg)" stroke="var(--text-2)" />
          ))}
          <line x1={X(11.6)} x2={X(11.6)} y1="10" y2={H - 20} stroke="var(--warn)" strokeDasharray="3 3" />
          <circle cx={X(m)} cy={Y(sig(m))} r="5" fill="var(--warn)" />
          <text x={W - 10} y={H - 6} textAnchor="end" fontSize="9" fill="var(--muted)">
            mM
          </text>
        </svg>
      </div>
      <div className="rounded-xl border border-line bg-surface/60 p-3 text-[11px] text-text-2">
        Reference patch white-balance applied · session auto-calibrated
      </div>
      <p className="mono text-center text-[9px] text-warn">Illustrative curve — no measured standards</p>
    </div>
  );
}

function ResultScreen({ zones }: { zones: Zones }) {
  return (
    <div className="space-y-2">
      <div className="mono rounded-lg border border-warn/40 bg-warn/10 px-2 py-1 text-center text-[9px] tracking-widest text-warn">SIMULATED · NOT A REAL TEST</div>
      {zones.map((z) => (
        <div key={z.chem.target} className="flex items-center justify-between rounded-xl border border-line bg-surface/60 p-3">
          <div>
            <div className="text-sm">{z.chem.name}</div>
            <div className="mono text-[10px] text-text-2">{fmt(z.est, z.chem.unit)}</div>
          </div>
          <span className={`flex items-center gap-1 text-xs ${z.flagged ? "text-bad" : "text-good"}`}>
            {z.flagged ? <CircleX className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
            {z.flagged ? (z.chem.thresholdKind === "limit" ? "Above limit" : "Detected") : "OK"}
          </span>
        </div>
      ))}
      <div className="rounded-xl border border-line bg-surface/60 p-3 text-[11px] text-text-2">Control zone: valid · Logged to sheet</div>
    </div>
  );
}

function HistoryScreen() {
  const rows = [
    { when: "Today 09:12", what: "Milk · 4 zones", flag: true },
    { when: "Yesterday 18:40", what: "Milk · 4 zones", flag: false },
    { when: "Mon 11:05", what: "Turmeric · Pb", flag: false },
    { when: "Sun 16:22", what: "Milk · 4 zones", flag: false },
  ];
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.when} className="flex items-center justify-between rounded-xl border border-line bg-surface/60 p-3">
          <div>
            <div className="text-xs">{r.what}</div>
            <div className="mono text-[10px] text-muted">{r.when}</div>
          </div>
          <span className={`flex items-center gap-1.5 text-[10px] ${r.flag ? "text-bad" : "text-good"}`}>
            <span className={`h-2 w-2 rounded-full ${r.flag ? "bg-bad" : "bg-good"}`} />
            {r.flag ? "Flagged" : "OK"}
          </span>
        </div>
      ))}
      <p className="mono text-center text-[9px] text-warn">Sample entries for the mock-up</p>
    </div>
  );
}
