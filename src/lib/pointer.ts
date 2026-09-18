"use client";

/**
 * Window-wide normalized pointer (-1..1, y up). 3D scenes read it inside
 * useFrame so the device reacts to the mouse even when the cursor is over
 * overlaid text rather than the canvas itself.
 */
export const windowPointer = { x: 0, y: 0 };

let attached = false;
export function attachWindowPointer() {
  if (attached || typeof window === "undefined") return;
  attached = true;
  window.addEventListener(
    "pointermove",
    (e) => {
      windowPointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      windowPointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    },
    { passive: true },
  );
}
