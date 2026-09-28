"use client";
import { useSyncExternalStore } from "react";
import { create } from "zustand";
import { STEPS, type StepId } from "@/content/nanosense";

export type Route = { page: "home" } | { page: "how" } | { page: "status" } | { page: "demo"; step: StepId };

function parse(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  if (h.startsWith("demo/")) {
    const id = h.slice(5) as StepId;
    if (STEPS.some((s) => s.id === id)) return { page: "demo", step: id };
  }
  if (h === "how") return { page: "how" };
  if (h === "status") return { page: "status" };
  return { page: "home" };
}

const subscribe = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};

export function useRoute(): Route {
  const hash = useSyncExternalStore(
    subscribe,
    () => window.location.hash,
    () => "",
  );
  return parse(hash);
}

export function go(to: "home" | "how" | "status" | StepId) {
  const h = to === "home" ? "#/" : to === "how" || to === "status" ? `#/${to}` : `#/demo/${to}`;
  if (window.location.hash !== h) window.location.hash = h;
  window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function stepIndex(id: StepId) {
  return STEPS.findIndex((s) => s.id === id);
}

export function nextStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i >= 0 && i < STEPS.length - 1 ? STEPS[i + 1].id : null;
}

export function prevStep(id: StepId): StepId | null {
  const i = stepIndex(id);
  return i > 0 ? STEPS[i - 1].id : null;
}

/** Overlay presentation modes. */
export const useOverlay = create<{ mode: null | "follow" | "judge"; open: (m: "follow" | "judge") => void; close: () => void }>((set) => ({
  mode: null,
  open: (mode) => set({ mode }),
  close: () => set({ mode: null }),
}));
