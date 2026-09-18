"use client";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, CircleCheck, CircleX, Droplet, Play, RotateCcw, ScanLine } from "lucide-react";
import { FOODS, getFood, getTarget, type FoodId, type Method, type Target, type TargetId } from "@/content/research";
import { Container, Section, SectionHeader } from "@/components/ui/Section";
import { Button, Chip } from "@/components/ui/Chip";
import { EvidenceBadge, SimulatedBanner } from "@/components/ui/EvidenceBadge";
import { CanvasFallback, LazyMount } from "@/components/three/LazyMount";
import { LEGENDS } from "@/components/nano/NanoWorld";
import type { LedState } from "@/components/three/device/Device";
import { useDemo } from "@/lib/store";
import { hexToRgb } from "@/lib/color";
import { NEXT, STEPS, STEP_OF, formatValue, simulate, type Phase, type Scenario, type SimResult } from "./model";
import { SignalChart } from "./SignalChart";

const TestScene = dynamic(() => import("./TestScene"), { ssr: false, loading: () => <CanvasFallback /> });

const NANO_STAGES = [
  { at: 0, label: "Target analyte" },
  { at: 0.38, label: "Nano-sensing surface" },
  { at: 0.55, label: "Signal change" },
  { at: 0.85, label: "Detection" },
];

const CAPTION: Partial<Record<Phase, string>> = {
  food: "Choose a food sample to begin",
  target: "Choose the suspected adulterant",
  "insert-ready": "Pipette ready above the sample inlet",
  inserting: "Dispensing 50–100 µL · capillary flow through the paper · cartridge loading",
  "run-ready": "Cartridge loaded — chamber closed",
  scanning: "LEDs on · photodiode reading the sensing zone",
  nano: "Entering the sensing zone — nanoscale view",
  "zoom-out": "Returning to the reader",
  analyzing: "ESP32 converts the raw signal using a calibration curve",
  result: "Simulated result ready",
};

export function TestDemo() {
  const [phase, setPhase] = useState<Phase>("food");
  const [food, setFood] = useState<FoodId | null>(null);
  const [target, setTarget] = useState<TargetId | null>(null);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<Scenario>("adulterated");
  const [seed, setSeed] = useState(1);
  const [nanoP, setNanoP] = useState(0);
  // pick-up from other sections ("Run a simulated test")
  useEffect(
    () =>
      useDemo.subscribe((s, prev) => {
        if (s.nonce === prev.nonce || !s.food) return;
        setFood(s.food);
        setTarget(s.target);
        setMethodId(s.methodId);
        setPhase(s.target ? "insert-ready" : "target");
      }),
    [],
  );

  const tgt = target ? getTarget(target) : null;
  const method = tgt ? (tgt.methods.find((m) => m.id === methodId) ?? tgt.methods[0]) : null;
  const result = useMemo(() => (tgt && method ? simulate(tgt, method, scenario, seed) : null), [tgt, method, scenario, seed]);
  const positive = scenario === "adulterated";
  const step = STEP_OF[phase];
  const busy = ["inserting", "scanning", "nano", "zoom-out", "analyzing"].includes(phase);

  const onPhaseDone = useCallback((p: Phase) => {
    const n = NEXT[p];
    if (n) setPhase((cur) => (cur === p ? n : cur));
  }, []);

  const led: LedState = phase === "result" ? (result?.verdict === "fail" ? "fail" : "pass") : busy ? "busy" : "off";
  const screen = useMemo(() => {
    const name = tgt?.name.toUpperCase() ?? "";
    switch (phase) {
      case "inserting":
        return ["SAMPLE", "LOADING", "Capillary flow..."];
      case "run-ready":
        return ["CARTRIDGE OK", name.slice(0, 12), "Press TEST"];
      case "scanning":
      case "nano":
        return ["MEASURING", "SCAN...", method?.kind === "electrochemical" ? "Potentiostat" : "LED + photodiode"];
      case "zoom-out":
      case "analyzing":
        return ["PROCESSING", "ANALYZE", "Calibration curve"];
      case "result":
        return ["SIMULATED", result ? formatValue(result.value, tgt!.unit) : "", result?.verdict === "fail" ? "FLAGGED" : "OK", "Demo only"];
      default:
        return ["NANOFOOD KIT", "READY", "Insert cartridge", "DEMO UI"];
    }
  }, [phase, tgt, method, result]);

  const reset = () => {
    setPhase("food");
    setFood(null);
    setTarget(null);
    setMethodId(null);
    setNanoP(0);
  };

  const chooseFood = (f: FoodId) => {
    setFood(f);
    setTarget(null);
    setMethodId(null);
    setPhase("target");
  };
  const chooseTarget = (t: TargetId) => {
    setTarget(t);
    setMethodId(getTarget(t).methods[0].id);
  };

  const nanoStage = NANO_STAGES.reduce((acc, s, i) => (nanoP >= s.at ? i : acc), 0);

  return (
    <Section id="test" className="py-24 md:py-32">
      <Container>
        <SectionHeader
          index="03"
          eyebrow="Interactive demo"
          title="Test a sample"
          lead="Walk through the full proposed workflow, from sample to result. The result comes from a scenario you pick. Nothing is measured, and every output is labelled as simulated."
          aside={<SimulatedBanner />}
        />

        <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* ---------------- control column ---------------- */}
          <div className="order-2 flex flex-col gap-4 lg:order-1">
            <ol className="grid grid-cols-6 gap-1.5" aria-label="Progress">
              {STEPS.map((s, i) => {
                const n = i + 1;
                const state = n < step ? "done" : n === step ? "now" : "todo";
                return (
                  <li key={s} className="flex flex-col gap-1.5" aria-current={state === "now" ? "step" : undefined}>
                    <span className={`h-1 rounded-full transition-colors ${state === "todo" ? "bg-line-2" : "bg-nano"} ${state === "now" && busy ? "animate-pulse" : ""}`} />
                    <span className={`mono text-[9px] leading-tight tracking-wider uppercase ${state === "now" ? "text-nano" : "text-muted"}`}>
                      {String(n).padStart(2, "0")}
                      <span className="hidden sm:inline"> {s}</span>
                    </span>
                  </li>
                );
              })}
            </ol>

            <div className="rounded-2xl border border-line-2 bg-surface/70 p-5">
              <AnimatePresence mode="wait">
                <motion.div key={step} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.25 }}>
                  <div className="eyebrow mb-3">
                    Step {String(step).padStart(2, "0")} — {STEPS[step - 1]}
                  </div>

                  {step === 1 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {FOODS.map((f) => (
                          <Chip key={f.id} active={food === f.id} disabled={f.targets.length === 0} onClick={() => chooseFood(f.id)}>
                            {f.name}
                          </Chip>
                        ))}
                      </div>
                      <p className="text-xs text-text-2">Only milk and turmeric have prototype targets with enough detail in the research to simulate.</p>
                    </div>
                  )}

                  {step === 2 && food && (
                    <div className="space-y-4">
                      <div>
                        <div className="mb-2 text-xs text-text-2">Suspected adulterant in {getFood(food).name.toLowerCase()}</div>
                        <div className="flex flex-wrap gap-2">
                          {getFood(food).targets.map((t) => (
                            <Chip key={t} active={target === t} onClick={() => chooseTarget(t)} className="mono text-xs tracking-wider uppercase">
                              {getTarget(t).name}
                            </Chip>
                          ))}
                        </div>
                      </div>
                      {tgt && tgt.methods.length > 1 && (
                        <div>
                          <div className="mb-2 text-xs text-text-2">Detection mode</div>
                          <div className="flex flex-wrap gap-2">
                            {tgt.methods.map((m) => (
                              <Chip key={m.id} active={method?.id === m.id} onClick={() => setMethodId(m.id)}>
                                {m.name}
                              </Chip>
                            ))}
                          </div>
                        </div>
                      )}
                      {tgt && method && (
                        <div className="rounded-xl border border-line bg-bg/40 p-3 text-xs leading-relaxed text-text-2">
                          <span className="text-text">{method.chemistry}.</span> Signal: {method.signal}. Time: {method.time}.
                          {method.lit && <div className="mt-1.5 text-signal">{method.lit}</div>}
                        </div>
                      )}
                      <div className="flex items-center justify-between gap-3">
                        <button type="button" className="text-xs text-muted underline-offset-2 hover:text-text hover:underline" onClick={() => setPhase("food")}>
                          ← change food
                        </button>
                        <Button disabled={!tgt} onClick={() => setPhase("insert-ready")}>
                          Continue
                        </Button>
                      </div>
                    </div>
                  )}

                  {step === 3 && tgt && (
                    <div className="space-y-4">
                      <ScenarioPicker scenario={scenario} setScenario={setScenario} disabled={busy} targetName={tgt.name} />
                      {phase === "insert-ready" ? (
                        <Button onClick={() => { setSeed((s) => s + 1); setPhase("inserting"); }}>
                          <Droplet className="h-4 w-4" /> Insert sample
                        </Button>
                      ) : (
                        <p className="flex items-center gap-2 text-sm text-nano">
                          <span className="h-2 w-2 animate-ping rounded-full bg-nano" /> {CAPTION[phase]}
                        </p>
                      )}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="space-y-3">
                      {phase === "run-ready" ? (
                        <>
                          <p className="text-sm text-text-2">The cartridge is inside and the chamber is closed. Start the measurement.</p>
                          <Button onClick={() => setPhase("scanning")}>
                            <ScanLine className="h-4 w-4" /> Run detection
                          </Button>
                        </>
                      ) : (
                        <ol className="space-y-2">
                          {NANO_STAGES.map((s, i) => (
                            <li key={s.label} className={`flex items-center gap-2 text-sm ${phase === "nano" && i <= nanoStage ? "text-text" : "text-muted"}`}>
                              <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${phase === "nano" && i < nanoStage ? "border-nano bg-nano text-bg" : phase === "nano" && i === nanoStage ? "border-nano" : "border-line-2"}`}>
                                {phase === "nano" && i < nanoStage && <Check className="h-2.5 w-2.5" />}
                              </span>
                              {s.label}
                            </li>
                          ))}
                        </ol>
                      )}
                    </div>
                  )}

                  {step === 5 && method && result && (
                    <div className="space-y-2">
                      <p className="text-sm text-text-2">{CAPTION.analyzing}</p>
                      <SignalChart kind={method.kind} response={result.response} positive={positive} />
                    </div>
                  )}

                  {step === 6 && tgt && method && result && (
                    <ResultCard tgt={tgt} method={method} result={result} scenario={scenario} onReset={reset} onRerun={() => { setSeed((s) => s + 1); setPhase("insert-ready"); }} />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          {/* ---------------- 3D stage ---------------- */}
          <div className="relative order-1 h-[420px] overflow-hidden rounded-3xl border border-line-2 bg-[radial-gradient(ellipse_at_50%_30%,#0f2224,#070b0f_70%)] sm:h-[520px] lg:order-2 lg:h-[600px]">
            <LazyMount className="absolute inset-0" margin="100px">
              <TestScene
                phase={phase}
                food={food}
                target={target}
                method={method}
                positive={positive}
                zoneColor={result?.zoneColor ?? "#ffffff"}
                screen={screen}
                led={led}
                onPhaseDone={onPhaseDone}
                onNano={setNanoP}
              />
            </LazyMount>

            {/* transition flash */}
            <AnimatePresence>
              {(phase === "nano" || phase === "zoom-out") && (
                <motion.div
                  key={phase}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#bafff0_0%,#4fe3c1_25%,#05080b_75%)]"
                />
              )}
            </AnimatePresence>

            <div className="pointer-events-none absolute inset-x-3 top-3 flex items-start justify-between gap-2">
              <span className="mono rounded-full bg-bg/70 px-3 py-1 text-[10px] tracking-widest text-text-2 uppercase backdrop-blur">
                {phase === "nano" ? "Nanoscale · conceptual" : "Macro · device view"}
              </span>
              <EvidenceBadge type={phase === "nano" ? "concept" : "sim"} />
            </div>

            {phase === "nano" && method && (
              <div className="pointer-events-none absolute top-12 left-3 space-y-1 rounded-xl bg-bg/60 p-3 backdrop-blur">
                {LEGENDS[method.nanoMode].map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[11px] text-text-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: l.color }} /> {l.label}
                  </div>
                ))}
                {!positive && <div className="pt-1 text-[11px] text-warn">Clean scenario: no analyte present</div>}
              </div>
            )}

            {phase === "nano" && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 flex flex-wrap justify-center gap-1.5">
                {NANO_STAGES.map((s, i) => (
                  <span
                    key={s.label}
                    className={`mono rounded-full border px-2.5 py-1 text-[10px] tracking-wider uppercase transition-colors ${
                      i === nanoStage ? "border-nano bg-nano/20 text-nano" : i < nanoStage ? "border-line-2 text-text-2" : "border-line text-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
            )}

            {phase !== "nano" && (
              <div className="pointer-events-none absolute inset-x-3 bottom-3 text-center">
                <span className="mono rounded-full bg-bg/70 px-3 py-1 text-[11px] text-text-2 backdrop-blur">{CAPTION[phase]}</span>
              </div>
            )}
          </div>
        </div>
      </Container>
    </Section>
  );
}

function ScenarioPicker({ scenario, setScenario, disabled, targetName }: { scenario: Scenario; setScenario: (s: Scenario) => void; disabled: boolean; targetName: string }) {
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 text-xs text-text-2">What should the simulated sample contain?</legend>
      <div className="grid grid-cols-2 gap-2">
        {(["clean", "adulterated"] as Scenario[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setScenario(s)}
            aria-pressed={scenario === s}
            className={`rounded-xl border p-3 text-left text-sm transition-colors ${scenario === s ? "border-nano bg-nano/10" : "border-line-2 hover:border-nano/50"}`}
          >
            <div className="font-medium">{s === "clean" ? "Clean sample" : "Adulterated"}</div>
            <div className="text-xs text-text-2">{s === "clean" ? "Scenario preset: typical unadulterated value" : `Scenario preset: contains ${targetName.toLowerCase()}`}</div>
          </button>
        ))}
      </div>
    </fieldset>
  );
}

function ResultCard({
  tgt,
  method,
  result,
  scenario,
  onReset,
  onRerun,
}: {
  tgt: Target;
  method: Method;
  result: SimResult;
  scenario: Scenario;
  onReset: () => void;
  onRerun: () => void;
}) {
  const bad = result.verdict === "fail";
  const rgb = hexToRgb(result.zoneColor);
  return (
    <div className="space-y-4">
      <SimulatedBanner />
      <div>
        <div className="mono text-[10px] tracking-widest text-muted uppercase">Detection result · {tgt.name}</div>
        <div className="mt-1 flex items-end gap-3">
          <span className="text-4xl font-semibold tracking-tight">{formatValue(result.value, tgt.unit)}</span>
          <span className="mb-1 text-xs text-text-2">simulated input ({scenario})</span>
        </div>
        <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${bad ? "text-bad" : "text-good"}`}>
          {bad ? <CircleX className="h-4 w-4" /> : <CircleCheck className="h-4 w-4" />}
          {result.headline}
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-text-2">{result.detail}</p>
      </div>
      {method.kind === "colorimetric" && (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-bg/40 p-3">
          <span className="h-10 w-10 shrink-0 rounded-full border border-line-2" style={{ background: scenario === "adulterated" ? result.zoneColor : method.colorFrom }} />
          <div className="mono text-[11px] text-text-2">
            Zone color (illustrative)
            <br />R {rgb[0]} · G {rgb[1]} · B {rgb[2]}
          </div>
        </div>
      )}
      <dl className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <dt className="text-muted">Method</dt>
          <dd>{method.name}</dd>
        </div>
        <div>
          <dt className="text-muted">Literature time</dt>
          <dd>{method.time}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-muted">Reference</dt>
          <dd>{tgt.threshold.label}</dd>
        </div>
      </dl>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onRerun} variant="ghost">
          <Play className="h-4 w-4" /> Run again
        </Button>
        <Button onClick={onReset} variant="ghost">
          <RotateCcw className="h-4 w-4" /> New sample
        </Button>
      </div>
    </div>
  );
}
