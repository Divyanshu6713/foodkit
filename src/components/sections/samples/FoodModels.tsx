"use client";
import { useMemo } from "react";
import * as THREE from "three";
import type { FoodId } from "@/content/research";
import { mulberry32 } from "@/lib/color";

/** Stylized, recognisable food samples built from primitives. */

function Lathe({ pts, children, ...p }: { pts: [number, number][]; children: React.ReactNode } & React.ComponentPropsWithoutRef<"mesh">) {
  const geo = useMemo(() => new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 48), [pts]);
  return (
    <mesh geometry={geo} {...p}>
      {children}
    </mesh>
  );
}

const BOWL: [number, number][] = [
  [0.0, 0.0],
  [0.32, 0.0],
  [0.5, 0.08],
  [0.62, 0.26],
  [0.66, 0.4],
  [0.62, 0.4],
  [0.57, 0.28],
  [0.46, 0.13],
  [0.0, 0.1],
];

function Bowl({ color = "#e9e4da" }: { color?: string }) {
  return (
    <Lathe pts={BOWL}>
      <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={0.8} side={THREE.DoubleSide} />
    </Lathe>
  );
}

function PowderMound({ color }: { color: string }) {
  return (
    <group position={[0, 0.3, 0]}>
      <mesh scale={[0.56, 0.3, 0.56]}>
        <sphereGeometry args={[1, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}

function Glass({ fill, fillColor, height = 1.1, radius = 0.36, liquidRough = 0.3, liquidOpacity = 1 }: { fill: number; fillColor: string; height?: number; radius?: number; liquidRough?: number; liquidOpacity?: number }) {
  return (
    <group>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[radius, radius * 0.88, height, 40, 1, true]} />
        <meshPhysicalMaterial color="#dff3ff" transparent opacity={0.22} roughness={0.05} clearcoat={1} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
      <mesh position={[0, (height * fill) / 2 + 0.02, 0]}>
        <cylinderGeometry args={[radius * 0.94 - 0.02 * (1 - fill), radius * 0.86, height * fill, 40]} />
        <meshPhysicalMaterial color={fillColor} roughness={liquidRough} clearcoat={0.6} transparent={liquidOpacity < 1} opacity={liquidOpacity} />
      </mesh>
    </group>
  );
}

function Lentils({ color }: { color: string }) {
  const mats = useMemo(() => {
    const r = mulberry32(4);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const list: THREE.Matrix4[] = [];
    for (let i = 0; i < 140; i++) {
      const a = r() * Math.PI * 2;
      const d = Math.sqrt(r()) * 0.5;
      const h = 0.3 + (1 - d / 0.5) * 0.18 + r() * 0.04;
      q.setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3));
      list.push(m.clone().compose(new THREE.Vector3(Math.cos(a) * d, h, Math.sin(a) * d), q.clone(), new THREE.Vector3(0.07, 0.035, 0.07)));
    }
    return list;
  }, []);
  return (
    <instancedMesh
      args={[undefined, undefined, mats.length]}
      ref={(im) => {
        if (!im) return;
        mats.forEach((m, i) => im.setMatrixAt(i, m));
        im.instanceMatrix.needsUpdate = true;
      }}
    >
      <sphereGeometry args={[1, 10, 8]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </instancedMesh>
  );
}

const BOTTLE: [number, number][] = [
  [0, 0],
  [0.3, 0],
  [0.32, 0.05],
  [0.32, 0.8],
  [0.26, 0.98],
  [0.12, 1.12],
  [0.11, 1.35],
  [0.0, 1.35],
];

export function FoodModel({ id }: { id: FoodId }) {
  switch (id) {
    case "milk":
      return <Glass fill={0.82} fillColor="#f7f5ee" liquidRough={0.35} />;
    case "turmeric":
      return (
        <group>
          <Bowl />
          <PowderMound color="#e0a019" />
        </group>
      );
    case "chilli":
      return (
        <group>
          <Bowl color="#dcd6cc" />
          <PowderMound color="#b52a1c" />
        </group>
      );
    case "dal":
      return (
        <group>
          <Bowl color="#e1d9c8" />
          <Lentils color="#e9b949" />
        </group>
      );
    case "mustard":
      return (
        <group>
          <Lathe pts={BOTTLE}>
            <meshPhysicalMaterial color="#e9f6ff" transparent opacity={0.25} roughness={0.05} clearcoat={1} depthWrite={false} side={THREE.DoubleSide} />
          </Lathe>
          <mesh position={[0, 0.42, 0]}>
            <cylinderGeometry args={[0.28, 0.28, 0.78, 36]} />
            <meshPhysicalMaterial color="#d6a91e" roughness={0.1} clearcoat={1} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0, 1.4, 0]}>
            <cylinderGeometry args={[0.13, 0.13, 0.14, 24]} />
            <meshStandardMaterial color="#b3261e" roughness={0.5} />
          </mesh>
        </group>
      );
    case "honey":
      return (
        <group>
          <Glass fill={0.86} fillColor="#c77a12" height={0.9} radius={0.42} liquidRough={0.08} liquidOpacity={0.92} />
          <mesh position={[0, 0.95, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.12, 40]} />
            <meshStandardMaterial color="#7a4a1a" roughness={0.6} />
          </mesh>
          {/* dipper */}
          <group position={[0.18, 1.05, 0]} rotation-z={-0.35}>
            <mesh position={[0, 0.3, 0]}>
              <cylinderGeometry args={[0.03, 0.03, 0.8, 12]} />
              <meshStandardMaterial color="#b98a4e" roughness={0.7} />
            </mesh>
          </group>
        </group>
      );
    case "ghee":
      return (
        <group>
          <Glass fill={0.75} fillColor="#f1d27a" height={0.85} radius={0.44} liquidRough={0.5} />
          <mesh position={[0, 0.9, 0]}>
            <cylinderGeometry args={[0.47, 0.47, 0.1, 40]} />
            <meshStandardMaterial color="#c9a13a" metalness={0.8} roughness={0.35} />
          </mesh>
        </group>
      );
  }
}
