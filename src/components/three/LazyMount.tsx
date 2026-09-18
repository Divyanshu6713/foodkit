"use client";
import type { ReactNode } from "react";
import { useInView } from "@/lib/useInView";

/**
 * Mounts heavy children (WebGL canvases) only while the wrapper is near the
 * viewport. Keeps the number of live WebGL contexts small on a long page.
 */
export function LazyMount({
  children,
  className = "",
  margin = "250px",
  fallback,
}: {
  children: ReactNode;
  className?: string;
  margin?: string;
  fallback?: ReactNode;
}) {
  const [ref, inView] = useInView<HTMLDivElement>(`${margin} 0px ${margin} 0px`);
  return (
    <div ref={ref} className={className}>
      {inView ? children : (fallback ?? <CanvasFallback />)}
    </div>
  );
}

export function CanvasFallback({ label = "Loading 3D scene" }: { label?: string }) {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <span className="mono text-xs tracking-widest text-muted uppercase">{label}…</span>
    </div>
  );
}
