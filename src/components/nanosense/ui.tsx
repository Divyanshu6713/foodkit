"use client";
import { useId, useState, type ReactNode } from "react";
import { ArrowRight, Check, Info } from "lucide-react";
import { CATEGORY, GLOSSARY, type Category, type GlossaryKey } from "@/content/nanosense";

const TAG_TONE: Record<Category, string> = {
  physical: "border-ns-green/40 bg-ns-green/10 text-ns-green",
  digital: "border-ns-blue/40 bg-ns-blue/10 text-ns-blue",
  simulated: "border-ns-amber/40 bg-ns-amber/10 text-ns-amber",
  concept: "border-ns-violet/40 bg-ns-violet/10 text-ns-violet",
  literature: "border-ns-line2 bg-ns-surface2 text-ns-text2",
};

const TAG_DOT: Record<Category, string> = {
  physical: "bg-ns-green",
  digital: "bg-ns-blue",
  simulated: "bg-ns-amber",
  concept: "bg-ns-violet",
  literature: "bg-ns-muted",
};

export const CAT_TEXT: Record<Category, string> = {
  physical: "text-ns-green",
  digital: "text-ns-blue",
  simulated: "text-ns-amber",
  concept: "text-ns-violet",
  literature: "text-ns-text2",
};

export const CAT_BG: Record<Category, string> = TAG_DOT;

/** States where a piece of content comes from: physical lab, simulation or concept art. */
export function Tag({ c, long = false, className = "" }: { c: Category; long?: boolean; className?: string }) {
  return (
    <span
      title={CATEGORY[c].desc}
      className={`mono inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase ${long ? "" : "shrink-0"} ${TAG_TONE[c]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${TAG_DOT[c]}`} />
      {long ? CATEGORY[c].label : CATEGORY[c].short}
    </span>
  );
}

/** Loud label for any simulated number. */
export function SimLabel({ children = "Simulated Prototype Reading", className = "" }: { children?: ReactNode; className?: string }) {
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-md border border-ns-amber/45 bg-ns-amber/10 px-2 py-0.5 text-[10px] font-semibold tracking-[0.12em] text-ns-amber uppercase ${className}`}
    >
      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ns-amber" />
      {children}
    </span>
  );
}

export function Card({ children, className = "", as: As = "div" }: { children: ReactNode; className?: string; as?: "div" | "section" | "article" }) {
  return <As className={`ns-card ${className}`}>{children}</As>;
}

/** Hover/focus tooltip for a scientific term. */
export function Term({ k, children }: { k: GlossaryKey; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-block">
      <button
        type="button"
        className="ns-term"
        aria-describedby={open ? id : undefined}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
      >
        {children}
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="ns-glass absolute bottom-full left-1/2 z-50 mb-2 w-64 -translate-x-1/2 rounded-lg px-3 py-2 text-left text-xs leading-relaxed font-normal tracking-normal text-ns-text normal-case shadow-lg"
        >
          {GLOSSARY[k]}
        </span>
      )}
    </span>
  );
}

export function Btn({
  children,
  onClick,
  variant = "primary",
  className = "",
  icon = false,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  icon?: boolean;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  const v = {
    primary: "bg-ns-blue text-white hover:brightness-110 shadow-[0_6px_20px_-8px_var(--ns-blue)]",
    secondary: "border border-ns-line2 bg-ns-surface text-ns-text hover:border-ns-blue/50 hover:text-ns-blue",
    ghost: "text-ns-text2 hover:bg-ns-surface2 hover:text-ns-text",
  }[variant];
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all disabled:cursor-not-allowed disabled:opacity-40 ${v} ${className}`}
    >
      {children}
      {icon && <ArrowRight className="h-4 w-4" />}
    </button>
  );
}

export function StepHeader({ n, title, category, lead }: { n?: number; title: string; category?: Category; lead?: ReactNode }) {
  return (
    <header className="mb-6 max-w-3xl">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {n !== undefined && <span className="ns-eyebrow">Step {String(n).padStart(2, "0")}</span>}
        {category && <Tag c={category} long />}
      </div>
      <h1 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h1>
      {lead && <p className="mt-2 text-[15px] leading-relaxed text-ns-text2">{lead}</p>}
    </header>
  );
}

/** Instrument-style numeric readout. */
export function Readout({
  label,
  value,
  unit,
  sub,
  tone = "text-ns-text",
  big = false,
}: {
  label: ReactNode;
  value: ReactNode;
  unit?: string;
  sub?: ReactNode;
  tone?: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl border border-ns-line bg-ns-surface2 px-4 py-3">
      <div className="mono text-[10px] tracking-[0.14em] text-ns-muted uppercase">{label}</div>
      <div className={`mono mt-1 font-semibold tabular-nums ${big ? "text-3xl" : "text-xl"} ${tone}`}>
        {value}
        {unit && <span className="ml-1 text-sm font-medium text-ns-muted">{unit}</span>}
      </div>
      {sub && <div className="mt-1 text-[11px] text-ns-muted">{sub}</div>}
    </div>
  );
}

export function Note({ children, tone = "info", className = "" }: { children: ReactNode; tone?: "info" | "warn"; className?: string }) {
  const t = tone === "warn" ? "border-ns-amber/35 bg-ns-amber/[0.07]" : "border-ns-blue/25 bg-ns-blue/[0.06]";
  const i = tone === "warn" ? "text-ns-amber" : "text-ns-blue";
  return (
    <div role="note" className={`flex gap-2.5 rounded-xl border px-4 py-3 text-[13px] leading-relaxed text-ns-text2 ${t} ${className}`}>
      <Info className={`mt-0.5 h-4 w-4 shrink-0 ${i}`} />
      <div>{children}</div>
    </div>
  );
}

/** Vertical or horizontal chain of labelled boxes with animated connectors. */
export function Chain({
  items,
  active = -1,
  vertical = false,
  className = "",
}: {
  items: { label: ReactNode; category?: Category }[];
  active?: number;
  vertical?: boolean;
  className?: string;
}) {
  return (
    <ol className={`flex ${vertical ? "flex-col items-stretch" : "flex-col items-stretch md:flex-row md:items-center"} gap-0 ${className}`}>
      {items.map((it, i) => (
        <li key={i} className={`flex ${vertical ? "flex-col" : "flex-col md:flex-row md:items-center"} ${vertical ? "" : "md:flex-1"}`}>
          <div
            className={`rounded-lg border px-3 py-2 text-center text-[12px] font-medium transition-all duration-300 ${
              i === active
                ? "border-ns-blue bg-ns-blue/10 text-ns-blue shadow-[0_0_0_3px_color-mix(in_oklab,var(--ns-blue)_15%,transparent)]"
                : i < active
                  ? "border-ns-line2 bg-ns-surface2 text-ns-text"
                  : "border-ns-line bg-ns-surface text-ns-text2"
            } ${vertical ? "" : "md:flex-1"}`}
          >
            {it.label}
          </div>
          {i < items.length - 1 && (
            <div className={`flex items-center justify-center ${vertical ? "h-5" : "h-5 md:h-auto md:w-5"}`} aria-hidden>
              <span className={`block ${vertical ? "h-full w-px" : "h-full w-px md:h-px md:w-full"} ${i < active ? "bg-ns-blue" : "bg-ns-line2"}`} />
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[12px] font-medium text-ns-text2">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-ns-muted">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded-lg border border-ns-line2 bg-ns-surface px-3 py-2 text-sm text-ns-text outline-none transition-colors focus:border-ns-blue";

/**
 * Where a number or input comes from.
 *   experimental — entered/uploaded from the real laboratory experiment
 *   measured     — computed by this app from an experimental photo (uncalibrated imaging)
 *   simulated    — Demonstration / Simulated Reading
 */
export function Source({ kind, className = "" }: { kind: "experimental" | "measured" | "simulated"; className?: string }) {
  const m = {
    experimental: { t: "Experimental Input", c: "border-ns-green/45 bg-ns-green/10 text-ns-green" },
    measured: { t: "Measured from your photo · uncalibrated imaging", c: "border-ns-blue/45 bg-ns-blue/10 text-ns-blue" },
    simulated: { t: "Demonstration / Simulated Reading", c: "border-ns-amber/45 bg-ns-amber/10 text-ns-amber" },
  }[kind];
  return (
    <span className={`mono inline-flex max-w-full items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-[0.1em] uppercase ${m.c} ${className}`}>
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {m.t}
    </span>
  );
}

const STATES = [
  { id: "A", title: "Physical test only", msg: "Physical analytical response detected.", kind: "Qualitative" },
  { id: "B", title: "+ Image analysis", msg: "Optical feature successfully extracted.", kind: "Semi-quantitative signal" },
  { id: "C", title: "+ Valid calibration", msg: "Estimated concentration calculated from calibration model.", kind: "Quantitative estimate" },
] as const;

/** The three result states, with the reached ones ticked and the current one highlighted. */
export function ResultStates({ state, compact = false, noResponse = false }: { state: "none" | "A" | "B" | "C"; compact?: boolean; noResponse?: boolean }) {
  const reached = state === "none" ? 0 : state === "A" ? 1 : state === "B" ? 2 : 3;
  return (
    <ol className={`grid gap-2 ${compact ? "" : "md:grid-cols-3"}`}>
      {STATES.map((s, i) => {
        const on = i + 1 === reached;
        const done = i + 1 <= reached;
        const msg = s.id === "A" && noResponse ? "Physical test completed — no visible analytical response." : s.msg;
        return (
          <li
            key={s.id}
            className={`rounded-xl border p-3.5 transition-all ${
              on ? "border-ns-blue bg-ns-blue/[0.07] shadow-[0_0_0_3px_color-mix(in_oklab,var(--ns-blue)_12%,transparent)]" : done ? "border-ns-line2 bg-ns-surface" : "border-dashed border-ns-line2 bg-transparent opacity-60"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`mono grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${done ? "bg-ns-blue text-white" : "bg-ns-surface2 text-ns-muted"}`}>
                {done ? <Check className="h-3.5 w-3.5" /> : s.id}
              </span>
              <span className="text-[12.5px] font-semibold">
                State {s.id} · {s.title}
              </span>
            </div>
            <p className={`mt-1.5 text-[13px] leading-snug ${done ? "text-ns-text" : "text-ns-muted"}`}>{msg}</p>
            <div className="mono mt-1 text-[10px] tracking-wider text-ns-muted uppercase">{s.kind}</div>
          </li>
        );
      })}
    </ol>
  );
}
