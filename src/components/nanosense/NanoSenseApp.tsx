"use client";
import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Footprints, Menu, Moon, Presentation, Sun, X } from "lucide-react";
import { DrishyaIcon } from "@/components/brand/DrishyaIcon";
import { STEPS, type StepId } from "@/content/nanosense";
import { go, nextStep, prevStep, stepIndex, useOverlay, useRoute, type Route } from "./nav";
import { useNS } from "./store";
import { CAT_BG } from "./ui";
import { Landing } from "./views/Landing";
import { HowItWorks } from "./views/HowItWorks";
import { StatusPage } from "./views/Status";
import { Setup } from "./views/Setup";
import { Physical } from "./views/Physical";
import { NanoMechanism } from "./views/NanoMechanism";
import { BeforeAfter } from "./views/BeforeAfter";
import { ImageAnalysis } from "./views/ImageAnalysis";
import { References } from "./views/References";
import { Esp32 } from "./views/Esp32";
import { Processing } from "./views/Processing";
import { Calibration } from "./views/Calibration";
import { Unknown } from "./views/Unknown";
import { Summary } from "./views/Summary";
import { Comparison } from "./views/Comparison";
import { SystemFlow } from "./views/SystemFlow";
import { Report } from "./views/Report";
import { FollowSample } from "./modes/FollowSample";
import { JudgeMode } from "./modes/JudgeMode";

const VIEWS: Record<StepId, () => ReactNode> = {
  setup: () => <Setup />,
  physical: () => <Physical />,
  nano: () => <NanoMechanism />,
  "compare-nano": () => <BeforeAfter />,
  image: () => <ImageAnalysis />,
  calibration: () => <Calibration />,
  references: () => <References />,
  unknown: () => <Unknown />,
  comparison: () => <Comparison />,
  esp32: () => <Esp32 />,
  processing: () => <Processing />,
  flow: () => <SystemFlow />,
  report: () => <Report />,
  summary: () => <Summary />,
};

export function NanoSenseApp() {
  const route = useRoute();
  const theme = useNS((s) => s.theme);
  const overlay = useOverlay((s) => s.mode);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.resolve(useNS.persist.rehydrate()).finally(() => {
      // The simulation workspace is not stored; rebuild it if the page reopens in Simulation mode.
      useNS.getState().ensureDemo();
      setReady(true);
    });
  }, []);

  // Arrow keys step through the demo (not while typing or dragging a slider).
  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      if (route.page !== "demo" || overlay) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable]")) return;
      if (e.key === "ArrowRight") {
        const n = nextStep(route.step);
        if (n) go(n);
      } else if (e.key === "ArrowLeft") {
        const p = prevStep(route.step);
        if (p) go(p);
      }
    };
    window.addEventListener("keydown", on);
    return () => window.removeEventListener("keydown", on);
  }, [route, overlay]);

  const key = route.page === "demo" ? route.step : route.page;

  // Every page starts at the top, however it was reached (buttons, keys, back/forward).
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [key]);

  return (
    <div className="ns" data-theme={theme} style={{ opacity: ready ? 1 : 0, transition: "opacity 200ms" }}>
      <TopBar route={route} />
      <NoticeBar />
      {route.page === "demo" && <Stepper current={route.step} />}
      {/* Rendered only after mount: the server has no hash, so hydrating a route would flash the wrong page. */}
      {ready && (
        <AnimatePresence mode="wait">
          <motion.main
            key={key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className={route.page === "home" ? "" : "mx-auto max-w-6xl px-4 pt-8 pb-16 sm:px-6"}
          >
            {route.page === "home" && <Landing />}
            {route.page === "how" && <HowItWorks />}
            {route.page === "status" && <StatusPage />}
            {route.page === "demo" && (
              <>
                {VIEWS[route.step]()}
                <StepNav step={route.step} />
              </>
            )}
          </motion.main>
        </AnimatePresence>
      )}
      <Footer />
      <AnimatePresence>
        {overlay === "follow" && <FollowSample key="follow" />}
        {overlay === "judge" && <JudgeMode key="judge" />}
      </AnimatePresence>
    </div>
  );
}

function TopBar({ route }: { route: Route }) {
  const theme = useNS((s) => s.theme);
  const setTheme = useNS((s) => s.setTheme);
  const open = useOverlay((s) => s.open);
  const [menu, setMenu] = useState(false);
  const links: { to: "setup" | "how" | "status"; label: string; on: boolean }[] = [
    { to: "setup", label: "Demonstration", on: route.page === "demo" },
    { to: "how", label: "How it works", on: route.page === "how" },
    { to: "status", label: "Real vs simulated", on: route.page === "status" },
  ];
  const nav = (to: "setup" | "how" | "status") => {
    setMenu(false);
    go(to);
  };
  return (
    <header className="ns-noprint sticky top-0 z-40 border-b border-ns-line bg-[var(--ns-glass)] backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <button type="button" onClick={() => go("home")} className="flex items-center gap-2" aria-label="NanoSense home">
          <DrishyaIcon className="h-8 w-8" small />
          <span className="leading-tight">
            <span className="block text-[15px] font-semibold tracking-tight">NanoSense</span>
            <span className="mono block text-[9.5px] tracking-[0.14em] text-ns-muted uppercase">by Drishya</span>
          </span>
        </button>
        <nav className="ml-4 hidden items-center gap-1 md:flex" aria-label="NanoSense">
          {links.map((l) => (
            <button
              key={l.to}
              type="button"
              onClick={() => nav(l.to)}
              className={`rounded-full px-3 py-1.5 text-[13px] transition-colors ${l.on ? "bg-ns-blue/10 text-ns-blue" : "text-ns-text2 hover:text-ns-text"}`}
            >
              {l.label}
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-1.5">
          <ModeSwitch />
          <button
            type="button"
            onClick={() => open("follow")}
            className="hidden items-center gap-1.5 rounded-full border border-ns-line2 px-3 py-1.5 text-[13px] text-ns-text2 transition-colors hover:border-ns-blue/50 hover:text-ns-blue lg:inline-flex"
          >
            <Footprints className="h-3.5 w-3.5" /> Follow
          </button>
          <button
            type="button"
            onClick={() => open("judge")}
            className="inline-flex items-center gap-1.5 rounded-full bg-ns-text px-3 py-1.5 text-[13px] font-medium text-ns-bg transition-opacity hover:opacity-85"
          >
            <Presentation className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Judge Mode</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-full p-2 text-ns-text2 transition-colors hover:bg-ns-surface2 hover:text-ns-text"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <button type="button" className="rounded-full p-2 text-ns-text2 md:hidden" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}>
            {menu ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <ModeStrip />
      {menu && (
        <div className="grid gap-1 border-t border-ns-line px-4 py-3 md:hidden">
          {links.map((l) => (
            <button key={l.to} type="button" onClick={() => nav(l.to)} className="rounded-lg px-3 py-2 text-left text-sm text-ns-text2 hover:bg-ns-surface2">
              {l.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              setMenu(false);
              open("follow");
            }}
            className="rounded-lg px-3 py-2 text-left text-sm text-ns-text2 hover:bg-ns-surface2"
          >
            Follow the Sample
          </button>
        </div>
      )}
    </header>
  );
}

/** Progress indicator: each segment is coloured by what is real and what is simulated. */
function Stepper({ current }: { current: StepId }) {
  const ci = stepIndex(current);
  return (
    <div className="ns-noprint border-b border-ns-line bg-ns-surface/60">
      <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6">
        <div className="mb-1.5 flex items-center justify-between text-[11px] text-ns-muted">
          <span className="mono tracking-wider uppercase">
            Step {ci + 1} / {STEPS.length}
          </span>
          <span className="hidden items-center gap-3 sm:flex">
            <Legend c="bg-ns-green" t="Physical lab" />
            <Legend c="bg-ns-blue" t="Digital analysis" />
            <Legend c="bg-ns-violet" t="Concept" />
            <Legend c="bg-ns-muted" t="Literature" />
            <Legend c="bg-ns-amber" t="Simulated" />
          </span>
        </div>
        <ol className="flex gap-1" aria-label="Demonstration progress">
          {STEPS.map((s, i) => (
            <li key={s.id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => go(s.id)}
                aria-current={i === ci ? "step" : undefined}
                title={s.title}
                className="group block w-full text-left"
              >
                <span className={`block h-1.5 rounded-full transition-all ${i <= ci ? CAT_BG[s.category] : "bg-ns-line2"} ${i === ci ? "ring-2 ring-ns-blue/30" : ""}`} />
                <span
                  className={`mt-1 hidden truncate text-[10.5px] lg:block ${i === ci ? "font-semibold text-ns-text" : "text-ns-muted group-hover:text-ns-text2"}`}
                >
                  {s.short}
                </span>
              </button>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Persistent data-source badge. Clicking it switches between the two separate workspaces. */
function ModeSwitch() {
  const mode = useNS((s) => s.mode);
  const setMode = useNS((s) => s.setMode);
  const resetWorkspace = useNS((s) => s.resetWorkspace);
  const [open, setOpen] = useState(false);
  const real = mode === "real";
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={`Data source: ${real ? "Real experiment" : "Simulation"}. Change mode`}
        className={`mono inline-flex items-center gap-1.5 rounded-md border-2 px-2.5 py-1 text-[11px] font-bold tracking-[0.12em] uppercase ${
          real ? "border-ns-green bg-ns-green/10 text-ns-green" : "border-ns-amber bg-ns-amber/10 text-ns-amber"
        }`}
      >
        <span className={`h-2 w-2 rounded-full ${real ? "bg-ns-green" : "animate-pulse bg-ns-amber"}`} />
        {real ? "Real Experiment" : "Simulation"}
      </button>
      {open && (
        <div className="ns-card absolute right-0 z-50 mt-2 w-72 p-2">
          {(
            [
              ["real", "Real Experiment Mode", "Your laboratory observations, photos and experimental calibration data.", "text-ns-green"],
              ["demo", "Demonstration Mode", "Illustrative simulated data showing the complete proposed workflow.", "text-ns-amber"],
            ] as const
          ).map(([m, t, d, c]) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setMode(m);
                setOpen(false);
              }}
              className={`block w-full rounded-lg px-3 py-2.5 text-left hover:bg-ns-surface2 ${mode === m ? "bg-ns-surface2" : ""}`}
            >
              <div className={`text-[13px] font-semibold ${c}`}>
                {mode === m ? "● " : "○ "}
                {t}
              </div>
              <div className="mt-0.5 text-[12px] text-ns-text2">{d}</div>
            </button>
          ))}
          <p className="px-3 pt-1 pb-1.5 text-[11px] text-ns-muted">The two datasets are stored separately and never mixed.</p>
          <button
            type="button"
            onClick={() => {
              const msg = mode === "real" ? "Delete all experimental inputs (photos, observations, calibration) stored in this browser?" : "Reset the simulation to its initial illustrative data?";
              if (window.confirm(msg)) resetWorkspace();
              setOpen(false);
            }}
            className="mt-1 block w-full border-t border-ns-line px-3 pt-2 pb-1 text-left text-[12px] text-ns-muted hover:text-ns-amber"
          >
            {mode === "real" ? "Clear experimental data in this browser" : "Reset simulation"}
          </button>
        </div>
      )}
    </div>
  );
}

function ModeStrip() {
  const mode = useNS((s) => s.mode);
  return (
    <div
      className={`h-[3px] w-full ${mode === "real" ? "bg-ns-green" : "bg-[repeating-linear-gradient(135deg,var(--ns-amber)_0_10px,transparent_10px_16px)]"}`}
      aria-hidden
    />
  );
}

function NoticeBar() {
  const notice = useNS((s) => s.notice);
  const dismiss = useNS((s) => s.dismissNotice);
  if (!notice) return null;
  return (
    <div className="ns-noprint border-b border-ns-line bg-ns-blue/[0.07]">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-[12.5px] sm:px-6">
        <span className="flex-1">{notice}</span>
        <button type="button" onClick={dismiss} className="rounded p-1 text-ns-muted hover:text-ns-text" aria-label="Dismiss">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${c}`} />
      {t}
    </span>
  );
}

function StepNav({ step }: { step: StepId }) {
  const p = prevStep(step);
  const n = nextStep(step);
  const label = (id: StepId | null) => (id ? STEPS[stepIndex(id)].short : "");
  return (
    <div className="ns-noprint mt-10 flex items-center justify-between gap-3 border-t border-ns-line pt-5">
      {p ? (
        <button type="button" onClick={() => go(p)} className="inline-flex items-center gap-1.5 text-sm text-ns-text2 hover:text-ns-text">
          <ChevronLeft className="h-4 w-4" /> {label(p)}
        </button>
      ) : (
        <button type="button" onClick={() => go("home")} className="inline-flex items-center gap-1.5 text-sm text-ns-text2 hover:text-ns-text">
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
      )}
      <span className="mono hidden text-[10.5px] text-ns-muted sm:block">← → keys to navigate</span>
      {n ? (
        <button type="button" onClick={() => go(n)} className="inline-flex items-center gap-1.5 text-sm font-medium text-ns-blue">
          {label(n)} <ChevronRight className="h-4 w-4" />
        </button>
      ) : (
        <button type="button" onClick={() => go("status")} className="inline-flex items-center gap-1.5 text-sm font-medium text-ns-blue">
          Real vs simulated <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function Footer() {
  return (
    <footer className="ns-noprint border-t border-ns-line">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-[12px] text-ns-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <span>
          <b className="font-medium text-ns-text2">Drishya</b> — Smart Nano-Based Food Adulteration Detection System · Team RootStack
        </span>
        <span className="flex items-center gap-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ns-green" /> Physical demonstration
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ns-blue" /> Digital analysis
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-ns-amber" /> Simulated prototype
          </span>
          <Link href="/" className="underline-offset-2 hover:text-ns-text hover:underline">
            Main site
          </Link>
        </span>
      </div>
    </footer>
  );
}
