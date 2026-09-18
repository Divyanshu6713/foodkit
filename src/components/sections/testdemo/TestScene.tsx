"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import type { FoodId, Method, NanoMode, TargetId } from "@/content/research";
import { Device, type LedState } from "@/components/three/device/Device";
import { StudioLights } from "@/components/three/StudioLights";
import { SAMPLE_TINT, zoneSoak, type StripState } from "@/components/three/stripTexture";
import { NanoLights, NanoWorld } from "@/components/nano/NanoWorld";
import { FoodModel } from "../samples/FoodModels";
import { attachWindowPointer, windowPointer } from "@/lib/pointer";
import { band, mixHex, smooth } from "@/lib/color";
import { AUTO_DURATION, type Phase } from "./model";

export interface TestSceneProps {
  phase: Phase;
  food: FoodId | null;
  target: TargetId | null;
  method: Method | null;
  positive: boolean;
  zoneColor: string;
  screen: string[];
  led: LedState;
  onPhaseDone: (p: Phase) => void;
  onNano: (p: number) => void;
}

type V3 = [number, number, number];

const INLET_Z = 0.73 + 1.75; // strip inlet in world space when the cartridge is out
const ELECTRODE_WE: V3 = [1.02 + 1.3, 0.04, -0.3];

function Pipette({ visible, tip }: { visible: boolean; tip: V3 }) {
  const g = useRef<THREE.Group>(null!);
  useFrame((_, dt) => {
    easing.damp3(g.current.position, visible ? tip : [tip[0], tip[1] + 3, tip[2]], 0.35, dt);
  });
  return (
    <group ref={g} position={[tip[0], tip[1] + 3, tip[2]]}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.05, 0.015, 1.1, 20]} />
        <meshPhysicalMaterial color="#e9f7ff" transparent opacity={0.45} roughness={0.05} clearcoat={1} depthWrite={false} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.12, 24, 16]} />
        <meshStandardMaterial color="#4fe3c1" roughness={0.4} />
      </mesh>
    </group>
  );
}

function Scene(props: TestSceneProps) {
  const { camera, size } = useThree();
  const { phase, food, method, positive, zoneColor } = props;
  const electro = method?.kind === "electrochemical";
  const wide = size.width > 640;
  const t0 = useRef(0);
  const clock = useRef(0);
  const done = useRef<Phase | null>(null);
  const look = useRef(new THREE.Vector3(0.3, 0, 0.5));
  const nanoP = useRef(0);
  const macro = useRef<THREE.Group>(null!);
  const nano = useRef<THREE.Group>(null!);
  const drop = useRef<THREE.Mesh>(null!);
  const lastNano = useRef(0);
  const snapNext = useRef(false);
  // latched per phase: set once during "inserting", implicitly reset by any phase change
  const [slidIn, setSlidIn] = useState<Phase | null>(null);
  const [liftedIn, setLiftedIn] = useState<Phase | null>(null);
  const slid = !(phase === "food" || phase === "target" || phase === "insert-ready" || phase === "inserting") || slidIn === phase;
  const pipetteUp = liftedIn === phase;
  useEffect(() => attachWindowPointer(), []);

  const strip = useRef<StripState & { v: number }>({
    flow: 0,
    sampleTint: SAMPLE_TINT.milk,
    zoneColor: {},
    dropped: false,
    focus: null,
    layout: "milk",
    v: 0,
  });

  // reset the strip whenever a new test starts
  useEffect(() => {
    const s = strip.current;
    const pb = props.target === "leadchromate";
    s.layout = pb ? "pb" : "milk";
    s.sampleTint = food ? (SAMPLE_TINT[food] ?? SAMPLE_TINT.milk) : SAMPLE_TINT.milk;
    s.focus = props.target ?? null;
    if (phase === "food" || phase === "target" || phase === "insert-ready") {
      s.flow = 0;
      s.dropped = false;
      s.zoneColor = {};
    }
    s.v++;
  }, [phase, food, props.target]);

  // Phase changes are detected inside the frame loop (not an effect): a frame
  // can run between React's commit and the effect flush, which would time the
  // new phase against the previous phase's start.
  const seenPhase = useRef<Phase | null>(null);

  const tip: V3 = electro ? [ELECTRODE_WE[0], 0.2, ELECTRODE_WE[2]] : [0.75, 0.22, INLET_Z];

  useFrame((state, dt) => {
    clock.current = state.clock.elapsedTime;
    if (seenPhase.current !== phase) {
      seenPhase.current = phase;
      t0.current = clock.current;
      done.current = null;
      snapNext.current = phase === "nano" || phase === "zoom-out";
    }
    const el = clock.current - t0.current;
    const dur = AUTO_DURATION[phase];
    if (dur && el >= dur && done.current !== phase) {
      done.current = phase;
      props.onPhaseDone(phase);
    }
    const k = dur ? Math.min(1, el / dur) : 0;
    const p = windowPointer;

    if (phase === "inserting" && el > 4 && slidIn !== phase) setSlidIn(phase);
    if (phase === "inserting" && el > 1.8 && liftedIn !== phase) setLiftedIn(phase);

    /* ---- strip + droplet during insertion ---- */
    const s = strip.current;
    if (phase === "inserting") {
      const fall = band(el, 0.5, 1.1);
      drop.current.visible = el > 0.4 && el < 1.3;
      drop.current.position.set(tip[0], THREE.MathUtils.lerp(tip[1] + 0.05, electro ? 0.05 : 0.12, fall * fall), tip[2]);
      drop.current.scale.set(1 + band(el, 1.1, 1.3) * 1.2, 1 - band(el, 1.1, 1.3) * 0.7, 1 + band(el, 1.1, 1.3) * 1.2);
      if (!electro) {
        const dropped = el > 1.1;
        const flow = smooth(band(el, 1.1, 3.9));
        if (dropped !== s.dropped || Math.abs(flow - s.flow) > 0.004) {
          s.dropped = dropped;
          s.flow = flow;
          s.v++;
        }
      }
    } else {
      drop.current.visible = false;
    }
    // reaction color appears once the zone is wet (reaction runs inside the reader)
    if ((phase === "scanning" || phase === "nano") && props.target && !electro) {
      const r = phase === "nano" ? 1 : band(el, 0, 2);
      const zone = props.target;
      const wet = zoneSoak(s.flow, zone === "leadchromate" ? "leadchromate" : zone);
      const c = positive ? mixHex(s.sampleTint, zoneColor, r * wet) : s.sampleTint;
      if (s.zoneColor[zone] !== c) {
        s.zoneColor = { ...s.zoneColor, [zone]: c };
        s.v++;
      }
    }

    /* ---- nano progress ---- */
    if (phase === "nano") {
      nanoP.current = smooth(band(el, 0.6, AUTO_DURATION.nano! - 0.6));
      if (clock.current - lastNano.current > 0.1) {
        lastNano.current = clock.current;
        props.onNano(nanoP.current);
      }
    } else if (phase !== "zoom-out") {
      nanoP.current = 0;
    }
    const inNano = phase === "nano";
    macro.current.visible = !inNano;
    nano.current.visible = inNano;

    /* ---- camera choreography ---- */
    let pos: V3;
    let tgt: V3;
    const far = wide ? 1 : 1.35;
    switch (phase) {
      case "inserting":
        if (electro) {
          pos = [3.9, 2.4, 3.3];
          tgt = [2.2, 0, -0.3];
        } else {
          pos = [2.4, 2.9, 6.4];
          tgt = [0.75, 0.1, 1.9];
        }
        if (el > 4) {
          pos = [1.2, 3.0, 6.4];
          tgt = [0.6, 0.1, 0.6];
        }
        break;
      case "run-ready":
      case "zoom-out":
        pos = [0.6 + p.x * 0.3, 3.1 + p.y * 0.3, 6.6 * far];
        tgt = [0.5, 0.1, 0.3];
        break;
      case "scanning": {
        const d = smooth(k);
        pos = electro ? [THREE.MathUtils.lerp(4, 2.2, d), THREE.MathUtils.lerp(2.4, 0.6, d), THREE.MathUtils.lerp(3, 0.6, d)] : [0.75, THREE.MathUtils.lerp(3, 1.05, d), THREE.MathUtils.lerp(5.5, 0.55, d)];
        tgt = electro ? [1.7, 0.02, -0.3] : [0.75, 0.38, 0.0];
        break;
      }
      case "nano":
        pos = [p.x * 0.6, 1.4 + p.y * 0.5, 11.5 * far];
        tgt = [0, 0, 0];
        break;
      default:
        pos = [0.2 + p.x * 0.4, 3.3 + p.y * 0.4, 8.2 * far];
        tgt = [0.1, 0, 0.6];
    }
    if (snapNext.current) {
      snapNext.current = false;
      if (phase === "zoom-out") pos = [0.75, 1.2, 1.2];
      camera.position.set(...pos);
      look.current.set(...(phase === "zoom-out" ? ([0.75, 0.3, 0] as V3) : tgt));
    } else {
      easing.damp3(camera.position, pos, phase === "scanning" ? 0.5 : 0.6, dt);
      easing.damp3(look.current, tgt, 0.45, dt);
    }
    camera.lookAt(look.current);
  });

  const cartridgeOut = !electro && !slid ? 1 : 0;
  const electrodeOut = electro && !slid ? 1 : 0;
  const nanoMode: NanoMode = method?.nanoMode ?? "agnp";

  return (
    <>
      <group ref={macro}>
        <StudioLights />
        <Device
          cartridgeOut={cartridgeOut}
          electrodeOut={electrodeOut}
          flapOpen={cartridgeOut}
          led={props.led}
          scanning={phase === "scanning"}
          screen={props.screen}
          strip={strip}
        />
        {food && (
          <group position={[-2.7, -0.4, 1.1]} scale={0.85}>
            <FoodModel id={food} />
          </group>
        )}
        <Pipette visible={phase === "insert-ready" || (phase === "inserting" && !pipetteUp)} tip={[tip[0], tip[1] + 0.12, tip[2]]} />
        <mesh ref={drop} visible={false}>
          <sphereGeometry args={[0.06, 20, 16]} />
          <meshPhysicalMaterial color={food === "turmeric" ? "#e2b84a" : "#f7f5ee"} roughness={0.15} clearcoat={1} />
        </mesh>
        <ContactShadows position={[0, -0.44, 0]} opacity={0.55} scale={12} blur={2.4} far={3} />
      </group>
      <group ref={nano} visible={false}>
        <NanoLights />
        <NanoWorld mode={nanoMode} progress={nanoP} positive={positive} />
      </group>
    </>
  );
}

export default function TestScene(props: TestSceneProps) {
  const memo = useMemo(() => ({ fog: new THREE.Fog("#05080b", 12, 26) }), []);
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0.2, 3.3, 8.2], fov: 34 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onCreated={({ scene }) => {
        scene.fog = memo.fog;
      }}
    >
      <Scene {...props} />
    </Canvas>
  );
}
