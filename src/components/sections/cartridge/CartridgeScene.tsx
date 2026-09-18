"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { StudioLights } from "@/components/three/StudioLights";
import { createStripTexture, zoneSoak, SAMPLE_TINT, STRIP_ZONES, type ZoneId } from "@/components/three/stripTexture";
import { getTarget, type TargetId } from "@/content/research";
import { band, mixHex, smooth } from "@/lib/color";

const STRIP_W = 1.2;
const STRIP_H = 3.6; // 2 cm × 6 cm → 1 : 3
const TILT = 0.21; // ~12° incline for gravity-assisted flow

export interface CartridgeSceneProps {
  playKey: number;
  present: Record<TargetId, boolean>;
  focus: ZoneId | null;
}

function Strip({ playKey, present, focus }: CartridgeSceneProps) {
  const tex = useMemo(() => createStripTexture(), []);
  useEffect(() => () => tex.texture.dispose(), [tex]);
  const start = useRef<number | null>(null);
  const last = useRef("");
  const drop = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (playKey > 0 && start.current === null) start.current = now;
    const el = start.current === null ? -1 : now - start.current;
    const flow = el < 0 ? 0 : smooth(band(el, 0.8, 5));
    const dropped = el > 0.8;
    const zoneColor: Partial<Record<ZoneId, string>> = {};
    for (const z of STRIP_ZONES) {
      if (z.id === "control") continue;
      const t = getTarget(z.id as TargetId);
      const soak = zoneSoak(flow, z.id);
      const react = band(el - 5 * zoneSoakTime(z.id), 0, 2.5);
      zoneColor[z.id] = present[z.id as TargetId]
        ? mixHex(SAMPLE_TINT.milk, mixHex(t.methods[0].colorFrom, t.methods[0].colorTo, 0.85), soak * react)
        : SAMPLE_TINT.milk;
    }
    const key = `${flow.toFixed(3)}|${dropped}|${Object.values(zoneColor).join()}|${focus}`;
    if (key !== last.current) {
      last.current = key;
      tex.draw({ flow, dropped, sampleTint: SAMPLE_TINT.milk, zoneColor, focus, layout: "milk" });
    }
    // falling drop
    const f = band(el, 0.2, 0.8);
    drop.current.visible = el > 0.1 && el < 0.9;
    drop.current.position.set(0, 0.9 - f * f * 0.85, STRIP_H * 0.37);
  });

  return (
    <group rotation-x={-TILT}>
      {/* holder */}
      <RoundedBox args={[STRIP_W + 0.5, 0.18, STRIP_H + 0.6]} radius={0.06} position={[0, -0.1, 0]}>
        <meshPhysicalMaterial color="#5b7b86" roughness={0.55} clearcoat={0.2} />
      </RoundedBox>
      {/* frame clip */}
      {[
        [0, 0.03, -(STRIP_H / 2 + 0.17), STRIP_W + 0.5, 0.34],
        [0, 0.03, STRIP_H / 2 + 0.17, STRIP_W + 0.5, 0.34],
        [-(STRIP_W / 2 + 0.17), 0.03, 0, 0.34, STRIP_H],
        [STRIP_W / 2 + 0.17, 0.03, 0, 0.34, STRIP_H],
      ].map(([x, y, z, w, d], i) => (
        <RoundedBox key={i} args={[w, 0.08, d]} radius={0.03} position={[x, y, z]}>
          <meshPhysicalMaterial color="#4a6670" roughness={0.5} />
        </RoundedBox>
      ))}
      <mesh position={[0, 0.005, 0]} rotation-x={-Math.PI / 2}>
        <planeGeometry args={[STRIP_W, STRIP_H]} />
        <meshStandardMaterial map={tex.texture} roughness={0.95} />
      </mesh>
      {/* sample well ring over the inlet */}
      <mesh position={[0, 0.06, STRIP_H * 0.37]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.13, 0.2, 40]} />
        <meshStandardMaterial color="#4fe3c1" emissive="#4fe3c1" emissiveIntensity={0.4} />
      </mesh>
      <mesh ref={drop} visible={false}>
        <sphereGeometry args={[0.07, 20, 16]} />
        <meshPhysicalMaterial color="#f7f5ee" roughness={0.1} clearcoat={1} />
      </mesh>
      {/* incline wedge */}
      <mesh position={[0, -0.35, -0.2]} rotation-x={TILT}>
        <boxGeometry args={[STRIP_W + 0.3, 0.3, STRIP_H]} />
        <meshStandardMaterial color="#1a2229" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Rough time (as a fraction of the 5 s flow) at which each zone soaks. */
function zoneSoakTime(id: ZoneId) {
  return id === "urea" || id === "detergent" ? 0.55 : id === "starch" || id === "h2o2" ? 0.8 : 1;
}

export default function CartridgeScene(props: CartridgeSceneProps) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [2.6, 3.6, 4.2], fov: 38 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <StudioLights intensity={1.1} />
      <Strip key={props.playKey} {...props} />
      <ContactShadows position={[0, -0.75, 0]} opacity={0.5} scale={8} blur={2.4} far={2} />
      <OrbitControls enablePan={false} minDistance={3.5} maxDistance={9} autoRotate autoRotateSpeed={0.4} target={[0, 0, 0]} />
    </Canvas>
  );
}
