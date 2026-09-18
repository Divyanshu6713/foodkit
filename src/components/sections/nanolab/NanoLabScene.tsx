"use client";
import { useRef } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import type { NanoMode } from "@/content/research";
import { NanoLights, NanoWorld, Timeline } from "@/components/nano/NanoWorld";

export default function NanoLabScene({
  mode,
  goOnly,
  playKey,
  onProgress,
}: {
  mode: NanoMode;
  goOnly: boolean;
  playKey: number;
  onProgress: (p: number) => void;
}) {
  const progress = useRef(0);
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 1.6, 10], fov: 42 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <fog attach="fog" args={["#05080b", 11, 24]} />
      <NanoLights />
      <Timeline progress={progress} playKey={playKey} duration={8} onProgress={onProgress} />
      <NanoWorld key={`${mode}-${goOnly}`} mode={mode} goOnly={goOnly} progress={progress} positive spin={false} />
      <OrbitControls enablePan={false} enableZoom={false} autoRotate autoRotateSpeed={0.35} minPolarAngle={0.6} maxPolarAngle={2.2} />
    </Canvas>
  );
}
