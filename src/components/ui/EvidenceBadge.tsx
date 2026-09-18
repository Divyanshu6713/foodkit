import { EVIDENCE, type Evidence } from "@/content/research";

const TONE: Record<Evidence, string> = {
  lit: "text-signal border-signal/40 bg-signal/10",
  proposed: "text-nano border-nano/40 bg-nano/10",
  sim: "text-warn border-warn/50 bg-warn/10",
  concept: "text-ag border-ag/30 bg-ag/5",
};

const DOT: Record<Evidence, string> = {
  lit: "bg-signal",
  proposed: "bg-nano",
  sim: "bg-warn",
  concept: "bg-ag",
};

/** Small pill that states where a piece of content comes from. */
export function EvidenceBadge({ type, className = "", long = false }: { type: Evidence; className?: string; long?: boolean }) {
  const e = EVIDENCE[type];
  return (
    <span
      title={e.desc}
      className={`mono inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium tracking-[0.12em] uppercase ${TONE[type]} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[type]}`} />
      {long ? e.label : e.short}
    </span>
  );
}

/** Big, unmissable banner for simulated output. */
export function SimulatedBanner({ className = "" }: { className?: string }) {
  return (
    <div
      role="note"
      className={`mono flex items-center gap-2 rounded-md border border-warn/50 bg-warn/10 px-3 py-1.5 text-[11px] font-semibold tracking-[0.16em] text-warn uppercase ${className}`}
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-warn" />
      Simulated demonstration — not a real measurement
    </div>
  );
}
