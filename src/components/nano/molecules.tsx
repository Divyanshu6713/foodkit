"use client";
import { forwardRef } from "react";
import * as THREE from "three";

/**
 * Stylized ball-and-stick molecules (CPK-like colors). Geometry is shared.
 * Proportions are illustrative, not to scale.
 */

export const SPHERE = new THREE.SphereGeometry(1, 20, 14);
export const STICK = new THREE.CylinderGeometry(1, 1, 1, 8);

export const CPK = {
  C: "#40464d",
  O: "#ff5a52",
  N: "#5b86ff",
  H: "#e8eef2",
  I: "#8b3fd1",
  Pb: "#8fa2b8",
  S: "#e7c93a",
};

function Atom({ p, r, c, emissive = 0.15 }: { p: [number, number, number]; r: number; c: string; emissive?: number }) {
  return (
    <mesh geometry={SPHERE} position={p} scale={r}>
      <meshStandardMaterial color={c} roughness={0.35} metalness={0.05} emissive={c} emissiveIntensity={emissive} />
    </mesh>
  );
}

function Bond({ a, b, r = 0.025 }: { a: [number, number, number]; b: [number, number, number]; r?: number }) {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const len = va.distanceTo(vb);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vb.clone().sub(va).normalize());
  return (
    <mesh geometry={STICK} position={mid} quaternion={q} scale={[r, len, r]}>
      <meshStandardMaterial color="#9aa6b1" roughness={0.5} />
    </mesh>
  );
}

type G = React.ComponentPropsWithoutRef<"group"> & { glow?: number };

/** Urea, CO(NH₂)₂ */
export const Urea = forwardRef<THREE.Group, G>(function Urea({ glow = 0.15, ...p }, ref) {
  const C: [number, number, number] = [0, 0, 0];
  const O: [number, number, number] = [0, 0.26, 0];
  const N1: [number, number, number] = [-0.22, -0.13, 0];
  const N2: [number, number, number] = [0.22, -0.13, 0];
  return (
    <group ref={ref} {...p}>
      <Bond a={C} b={O} />
      <Bond a={C} b={N1} />
      <Bond a={C} b={N2} />
      <Atom p={C} r={0.085} c={CPK.C} emissive={glow} />
      <Atom p={O} r={0.095} c={CPK.O} emissive={glow} />
      <Atom p={N1} r={0.085} c={CPK.N} emissive={glow} />
      <Atom p={N2} r={0.085} c={CPK.N} emissive={glow} />
      {[
        [-0.36, -0.06, 0.05],
        [-0.26, -0.3, -0.05],
        [0.36, -0.06, -0.05],
        [0.26, -0.3, 0.05],
      ].map((h, i) => (
        <group key={i}>
          <Bond a={i < 2 ? N1 : N2} b={h as [number, number, number]} r={0.018} />
          <Atom p={h as [number, number, number]} r={0.05} c={CPK.H} emissive={glow} />
        </group>
      ))}
    </group>
  );
});

/** Hydrogen peroxide, H–O–O–H */
export const Peroxide = forwardRef<THREE.Group, G>(function Peroxide({ glow = 0.15, ...p }, ref) {
  const O1: [number, number, number] = [-0.12, 0, 0];
  const O2: [number, number, number] = [0.12, 0, 0];
  const H1: [number, number, number] = [-0.2, 0.18, 0.08];
  const H2: [number, number, number] = [0.2, -0.05, 0.18];
  return (
    <group ref={ref} {...p}>
      <Bond a={O1} b={O2} />
      <Bond a={O1} b={H1} r={0.018} />
      <Bond a={O2} b={H2} r={0.018} />
      <Atom p={O1} r={0.09} c={CPK.O} emissive={glow} />
      <Atom p={O2} r={0.09} c={CPK.O} emissive={glow} />
      <Atom p={H1} r={0.05} c={CPK.H} emissive={glow} />
      <Atom p={H2} r={0.05} c={CPK.H} emissive={glow} />
    </group>
  );
});

/** Triiodide, I₃⁻ */
export const Triiodide = forwardRef<THREE.Group, G>(function Triiodide({ glow = 0.3, ...p }, ref) {
  return (
    <group ref={ref} {...p}>
      {[-0.2, 0, 0.2].map((x) => (
        <Atom key={x} p={[x, 0, 0]} r={0.1} c={CPK.I} emissive={glow} />
      ))}
    </group>
  );
});

/** Pb²⁺ ion */
export const LeadIon = forwardRef<THREE.Group, G>(function LeadIon({ glow = 0.4, ...p }, ref) {
  return (
    <group ref={ref} {...p}>
      <Atom p={[0, 0, 0]} r={0.13} c={CPK.Pb} emissive={glow} />
      <mesh geometry={SPHERE} scale={0.22}>
        <meshBasicMaterial color="#9fc6ff" transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </group>
  );
});

/** Surfactant: polar head + hydrocarbon tail */
export const Surfactant = forwardRef<THREE.Group, G>(function Surfactant({ glow = 0.2, ...p }, ref) {
  return (
    <group ref={ref} {...p}>
      <Atom p={[0, 0.3, 0]} r={0.1} c="#5bd0ff" emissive={glow + 0.2} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Atom key={i} p={[Math.sin(i * 1.3) * 0.04, 0.16 - i * 0.1, 0]} r={0.045} c={CPK.C} emissive={glow} />
      ))}
    </group>
  );
});
