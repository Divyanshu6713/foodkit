"use client";
import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { FOODS, type FoodId, type ScopeStatus } from "@/content/research";
import { StudioLights } from "@/components/three/StudioLights";
import { attachWindowPointer, windowPointer } from "@/lib/pointer";
import { FoodModel } from "./FoodModels";

const RING: Record<ScopeStatus, string> = { prototype: "#4fe3c1", candidate: "#f2b33d", context: "#6f7e8b" };

interface Props {
  hovered: FoodId | null;
  selected: FoodId | null;
  onHover: (id: FoodId | null) => void;
  onSelect: (id: FoodId) => void;
}

function Sparks({ active, color }: { active: boolean; color: string }) {
  const ref = useRef<THREE.Points>(null!);
  const mat = useRef<THREE.PointsMaterial>(null!);
  const geo = useMemo(() => {
    const n = 60;
    const a = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const r = 0.75 + (i % 5) * 0.05;
      a[i * 3] = Math.cos(t) * r;
      a[i * 3 + 1] = 0.1 + (i % 7) * 0.18;
      a[i * 3 + 2] = Math.sin(t) * r;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(a, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * (active ? 1.4 : 0.2);
    mat.current.opacity = THREE.MathUtils.damp(mat.current.opacity, active ? 0.9 : 0.0, 6, dt);
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial ref={mat} size={0.05} color={color} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
    </points>
  );
}

function Item({ id, index, pos, props }: { id: FoodId; index: number; pos: [number, number, number]; props: Props }) {
  const food = FOODS[index];
  const g = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null!);
  const active = props.hovered === id || props.selected === id;
  const dim = props.selected !== null && props.selected !== id;
  const ring = RING[food.scope];

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    easing.damp3(g.current.position, [pos[0], pos[1] + (active ? 0.28 : 0) + Math.sin(t + index) * 0.03, pos[2]], 0.25, dt);
    inner.current.rotation.y += dt * (active ? 0.9 : 0.15);
    const s = props.selected === id ? 1.15 : 1;
    easing.damp3(g.current.scale, [s, s, s], 0.25, dt);
    ringMat.current.opacity = THREE.MathUtils.damp(ringMat.current.opacity, active ? 0.95 : dim ? 0.15 : 0.45, 6, dt);
  });

  return (
    <group
      ref={g}
      position={pos}
      onPointerOver={(e) => {
        e.stopPropagation();
        props.onHover(id);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        props.onHover(null);
        document.body.style.cursor = "";
      }}
      onClick={(e) => {
        e.stopPropagation();
        props.onSelect(id);
      }}
    >
      {/* pedestal */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[0.78, 0.82, 0.1, 48]} />
        <meshStandardMaterial color="#10171e" roughness={0.4} metalness={0.4} />
      </mesh>
      <mesh position={[0, 0.0, 0]} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[0.74, 0.79, 64]} />
        <meshBasicMaterial ref={ringMat} color={ring} transparent opacity={0.45} toneMapped={false} />
      </mesh>
      <group ref={inner}>
        <FoodModel id={id} />
      </group>
      <Sparks active={active} color={ring} />
      {/* invisible hit volume so hovering anywhere over the sample works */}
      <mesh position={[0, 0.7, 0]} visible={false}>
        <cylinderGeometry args={[0.8, 0.8, 1.6, 12]} />
      </mesh>
    </group>
  );
}

function Stage(props: Props) {
  const { size, camera } = useThree();
  const cols = size.width < 700 ? 4 : 7;
  const spot = useRef<THREE.SpotLight>(null!);
  const target = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => attachWindowPointer(), []);

  const positions = useMemo(
    () =>
      FOODS.map((_, i) => {
        if (cols === 7) return [(i - 3) * 1.8, 0, Math.abs(i - 3) * -0.25] as [number, number, number];
        const row = i < 4 ? 0 : 1;
        const n = row === 0 ? 4 : 3;
        const c = row === 0 ? i : i - 4;
        return [(c - (n - 1) / 2) * 1.85, 0, row === 0 ? -1.2 : 1.2] as [number, number, number];
      }),
    [cols],
  );

  useFrame((_, dt) => {
    const p = windowPointer;
    const base: [number, number, number] = cols === 7 ? [p.x * 0.6, 2.3 + p.y * 0.4, 9.6] : [p.x * 0.3, 5.2, 11];
    easing.damp3(camera.position, base, 0.6, dt);
    camera.lookAt(0, cols === 7 ? 0.4 : 0.2, 0);
    const focus = props.hovered ?? props.selected;
    const idx = focus ? FOODS.findIndex((f) => f.id === focus) : -1;
    const tp = idx >= 0 ? positions[idx] : [0, 0, 0];
    easing.damp3(target.position, [tp[0], 0.5, tp[2]], 0.2, dt);
    spot.current.intensity = THREE.MathUtils.damp(spot.current.intensity, idx >= 0 ? 60 : 0, 5, dt);
  });

  return (
    <>
      <primitive object={target} />
      <spotLight ref={spot} position={[0, 5, 2]} angle={0.35} penumbra={0.8} intensity={0} color="#dffdf5" target={target} />
      {FOODS.map((f, i) => (
        <Item key={f.id} id={f.id} index={i} pos={positions[i]} props={props} />
      ))}
      <ContactShadows position={[0, -0.12, 0]} opacity={0.6} scale={16} blur={2} far={2} />
    </>
  );
}

export default function SamplesScene(props: Props) {
  return (
    <Canvas dpr={[1, 1.75]} camera={{ position: [0, 2.6, 12.5], fov: 30 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <StudioLights intensity={0.9} />
      <Stage {...props} />
    </Canvas>
  );
}
