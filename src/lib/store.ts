"use client";
import { create } from "zustand";
import type { FoodId, TargetId } from "@/content/research";

/** Cross-section state: picking a sample in one section pre-loads the demo. */
interface DemoState {
  food: FoodId | null;
  target: TargetId | null;
  methodId: string | null;
  /** increments whenever another section asks the demo to (re)start */
  nonce: number;
  pick: (food: FoodId, target?: TargetId | null, methodId?: string | null) => void;
}

export const useDemo = create<DemoState>((set) => ({
  food: null,
  target: null,
  methodId: null,
  nonce: 0,
  pick: (food, target = null, methodId = null) =>
    set((s) => ({ food, target, methodId, nonce: s.nonce + 1 })),
}));

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
