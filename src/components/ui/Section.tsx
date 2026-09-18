import type { ReactNode } from "react";

export function Section({
  id,
  children,
  className = "",
  grid = false,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  grid?: boolean;
}) {
  return (
    <section id={id} className={`relative scroll-mt-16 ${className}`}>
      {grid && <div aria-hidden className="bg-grid pointer-events-none absolute inset-0 opacity-60" />}
      <div className="relative">{children}</div>
    </section>
  );
}

export function Container({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${className}`}>{children}</div>;
}

export function SectionHeader({
  index,
  eyebrow,
  title,
  lead,
  aside,
  center = false,
}: {
  index?: string;
  eyebrow: string;
  title: ReactNode;
  lead?: ReactNode;
  aside?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`mb-10 flex flex-col gap-6 md:mb-14 ${center ? "items-center text-center" : "md:flex-row md:items-end md:justify-between"}`}>
      <div className={center ? "max-w-3xl" : "max-w-3xl"}>
        <div className="eyebrow mb-4 flex items-center gap-3">
          {index && <span className="text-muted">{index}</span>}
          <span className="h-px w-8 bg-nano/50" />
          {eyebrow}
        </div>
        <h2 className="text-balance text-3xl font-semibold tracking-tight text-text sm:text-4xl lg:text-5xl">{title}</h2>
        {lead && <p className="mt-5 max-w-2xl text-base leading-relaxed text-text-2 sm:text-lg">{lead}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
