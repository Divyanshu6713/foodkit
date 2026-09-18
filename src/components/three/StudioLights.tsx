"use client";
import { Environment, Lightformer } from "@react-three/drei";

/**
 * Procedural studio environment: gives plastics and metals believable
 * reflections without downloading an HDR file.
 */
export function StudioLights({ intensity = 1, accent = "#4fe3c1" }: { intensity?: number; accent?: string }) {
  return (
    <>
      <ambientLight intensity={0.25 * intensity} />
      <directionalLight position={[4, 6, 5]} intensity={1.6 * intensity} />
      <directionalLight position={[-5, 3, -4]} intensity={0.5 * intensity} color="#9fc6ff" />
      <Environment resolution={256} frames={1}>
        <group rotation={[-Math.PI / 3, 0, 1]}>
          <Lightformer form="rect" intensity={3} position={[0, 5, -9]} scale={[10, 10, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer form="rect" intensity={1.2} position={[5, 1, -1]} rotation-y={-Math.PI / 2} scale={[20, 2, 1]} />
          <Lightformer form="ring" color={accent} intensity={2} position={[-4, -2, 4]} scale={3} />
          <Lightformer form="rect" intensity={0.8} position={[0, -4, 0]} rotation-x={Math.PI / 2} scale={[20, 20, 1]} color="#1b2735" />
        </group>
      </Environment>
    </>
  );
}
