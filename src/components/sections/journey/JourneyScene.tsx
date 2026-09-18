"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { easing } from "maath";
import { NanoLights, NanoWorld } from "@/components/nano/NanoWorld";
import { SPHERE, Urea } from "@/components/nano/molecules";
import { band, clamp, mulberry32, smooth } from "@/lib/color";
import { attachWindowPointer, windowPointer } from "@/lib/pointer";
import { JOURNEY_STOPS, depthAt } from "./stops";

/**
 * Powers-of-ten zoom. Each layer i is shown at scale 10^(d − i), where d is
 * the current zoom depth derived from scroll progress. At d = i the layer is
 * at its native size; at d = i + 1 it has grown ×10 and passed the camera.
 */

function layerScale(d: number, i: number) {
  return Math.pow(10, d - i);
}
function layerAlpha(d: number, i: number) {
  return clamp(band(d, i - 0.75, i - 0.2) * (1 - band(d, i + 0.35, i + 0.8)));
}

function useFade(group: RefObject<THREE.Group | null>) {
  const mats = useRef<THREE.Material[]>([]);
  useEffect(() => {
    const list: THREE.Material[] = [];
    group.current?.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | undefined;
      if (m) {
        m.transparent = true;
        list.push(m);
        m.userData.base = m.opacity;
      }
    });
    mats.current = list;
  }, [group]);
  return (a: number) => {
    for (const m of mats.current) m.opacity = (m.userData.base ?? 1) * a;
  };
}

function Layer({ index, depth, children }: { index: number; depth: RefObject<number>; children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null!);
  const fade = useFade(g);
  useFrame(() => {
    const d = depth.current ?? 0;
    const a = layerAlpha(d, index);
    g.current.visible = a > 0.01;
    if (!g.current.visible) return;
    g.current.scale.setScalar(layerScale(d, index));
    fade(a);
  });
  return <group ref={g}>{children}</group>;
}

/* ---- 0: the drop ---- */
function MilkDrop() {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    // classic teardrop: pointed top, round bottom
    for (let i = 0; i <= 48; i++) {
      const t = (i / 48) * Math.PI;
      pts.push(new THREE.Vector2(Math.sin(t) * Math.sin(t / 2) * 1.35, Math.cos(t) * 1.6));
    }
    return new THREE.LatheGeometry(pts, 64);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#f5f2ea" roughness={0.18} clearcoat={1} sheen={1} sheenColor="#fff" />
      </mesh>
    </group>
  );
}

/* ---- 1: emulsion microstructure (illustrative) ---- */
function Emulsion() {
  const data = useMemo(() => {
    const r = mulberry32(8);
    const fat = Array.from({ length: 34 }, () => ({ p: new THREE.Vector3((r() - 0.5) * 6, (r() - 0.5) * 4, (r() - 0.5) * 4), s: 0.25 + r() * 0.55 }));
    const mic = Array.from({ length: 140 }, () => ({ p: new THREE.Vector3((r() - 0.5) * 7, (r() - 0.5) * 4.5, (r() - 0.5) * 4), s: 0.06 + r() * 0.06 }));
    return { fat, mic };
  }, []);
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    g.current.rotation.y += dt * 0.05;
  });
  return (
    <group ref={g}>
      {data.fat.map((f, i) => (
        <mesh key={i} geometry={SPHERE} position={f.p} scale={f.s}>
          <meshPhysicalMaterial color="#fff3d6" roughness={0.2} transmission={0} clearcoat={1} opacity={0.85} transparent />
        </mesh>
      ))}
      <instancedMesh
        args={[SPHERE, undefined, data.mic.length]}
        ref={(m) => {
          if (!m) return;
          const mm = new THREE.Matrix4();
          data.mic.forEach((c, i) => m.setMatrixAt(i, mm.compose(c.p, new THREE.Quaternion(), new THREE.Vector3().setScalar(c.s))));
          m.instanceMatrix.needsUpdate = true;
        }}
      >
        <meshStandardMaterial color="#9fd1ff" roughness={0.8} emissive="#274a6a" emissiveIntensity={0.4} />
      </instancedMesh>
    </group>
  );
}

/* ---- 2 + 3: molecules, then the analyte highlighted ---- */
function Molecules({ highlight }: { highlight: RefObject<number> }) {
  const N = 180;
  const data = useMemo(() => {
    const r = mulberry32(12);
    return Array.from({ length: N }, () => ({ p: new THREE.Vector3((r() - 0.5) * 7, (r() - 0.5) * 4.5, (r() - 0.5) * 4), rot: r() * 6 }));
  }, []);
  const O = useRef<THREE.InstancedMesh>(null!);
  const H = useRef<THREE.InstancedMesh>(null!);
  const hMat = useRef<THREE.MeshStandardMaterial>(null!);
  const oMat = useRef<THREE.MeshStandardMaterial>(null!);
  const urea = useRef<THREE.Group>(null!);
  useEffect(() => {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const s = new THREE.Vector3();
    data.forEach((d, i) => {
      O.current.setMatrixAt(i, m.compose(d.p, q, s.setScalar(0.09)));
      const a = d.rot;
      H.current.setMatrixAt(i * 2, m.compose(d.p.clone().add(new THREE.Vector3(Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.03)), q, s.setScalar(0.055)));
      H.current.setMatrixAt(i * 2 + 1, m.compose(d.p.clone().add(new THREE.Vector3(Math.cos(a + 1.8) * 0.11, Math.sin(a + 1.8) * 0.11, -0.03)), q, s.setScalar(0.055)));
    });
    O.current.instanceMatrix.needsUpdate = true;
    H.current.instanceMatrix.needsUpdate = true;
  }, [data]);
  useFrame((state) => {
    const k = highlight.current ?? 0;
    const dim = 1 - k * 0.8;
    oMat.current.color.setRGB(1 * dim, 0.35 * dim, 0.32 * dim);
    hMat.current.color.setScalar(0.9 * dim);
    urea.current.children.forEach((c, i) => {
      c.rotation.y = state.clock.elapsedTime * 0.6 + i;
      c.scale.setScalar(1 + k * 0.6);
    });
  });
  const ureaPos = useMemo(() => {
    const r = mulberry32(99);
    return Array.from({ length: 9 }, () => new THREE.Vector3((r() - 0.5) * 5.5, (r() - 0.5) * 3.5, (r() - 0.5) * 2 + 0.5));
  }, []);
  return (
    <group>
      <instancedMesh ref={O} args={[SPHERE, undefined, N]}>
        <meshStandardMaterial ref={oMat} color="#ff5a52" roughness={0.4} />
      </instancedMesh>
      <instancedMesh ref={H} args={[SPHERE, undefined, N * 2]}>
        <meshStandardMaterial ref={hMat} color="#e8eef2" roughness={0.4} />
      </instancedMesh>
      <group ref={urea}>
        {ureaPos.map((p, i) => (
          <Urea key={i} position={p} glow={0.6} />
        ))}
      </group>
    </group>
  );
}

function Rig({ progress }: { progress: RefObject<number> }) {
  const depth = useRef(0);
  const highlight = useRef(0);
  const nanoP = useRef(0);
  const nano = useRef<THREE.Group>(null!);
  useEffect(() => attachWindowPointer(), []);

  useFrame((state, dt) => {
    const p = progress.current ?? 0;
    const target = depthAt(p);
    depth.current = THREE.MathUtils.damp(depth.current, target, 6, dt);
    const d = depth.current;
    highlight.current = band(p, JOURNEY_STOPS[3].from, JOURNEY_STOPS[3].from + 0.03);
    // nano layer: scale in around d = 4, event during stage "Detection event"
    const s5 = JOURNEY_STOPS[5];
    nanoP.current = smooth(band(p, s5.from - 0.02, s5.to));
    const na = band(d, 3.4, 3.95);
    nano.current.visible = na > 0.01;
    const back = 1 - 0.55 * smooth(band(p, JOURNEY_STOPS[6].from, 1));
    nano.current.scale.setScalar((0.1 + 0.9 * smooth(na)) * back);
    const w = windowPointer;
    easing.damp3(state.camera.position, [w.x * 0.6, w.y * 0.4, 7], 0.8, dt);
    state.camera.lookAt(0, 0, 0);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 4, 5]} intensity={1.6} />
      <NanoLights />
      <Layer index={0} depth={depth}>
        <MilkDrop />
      </Layer>
      <Layer index={1} depth={depth}>
        <Emulsion />
      </Layer>
      <Layer index={2} depth={depth}>
        <Molecules highlight={highlight} />
      </Layer>
      <group ref={nano} visible={false}>
        <NanoWorld mode="agnp" progress={nanoP} positive />
      </group>
    </>
  );
}

export default function JourneyScene({ progress }: { progress: RefObject<number> }) {
  return (
    <Canvas dpr={[1, 1.5]} camera={{ position: [0, 0, 7], fov: 45 }} gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}>
      <fog attach="fog" args={["#05080b", 7, 22]} />
      <Rig progress={progress} />
    </Canvas>
  );
}
