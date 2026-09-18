"use client";
import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useRef, type ReactNode, type RefObject } from "react";
import { useFrame, type ThreeEvent } from "@react-three/fiber";
import { Html, Line, RoundedBox } from "@react-three/drei";
import * as THREE from "three";
import { DEVICE_PARTS, getPart, type PartId } from "@/content/device";
import { createStripTexture, type StripState } from "../stripTexture";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type LedState = "off" | "busy" | "pass" | "fail";

export interface DeviceProps {
  explode?: number; // 0 assembled … 1 exploded (target; damped internally)
  hovered?: PartId | null;
  selected?: PartId | null;
  onHover?: (id: PartId | null) => void;
  onSelect?: (id: PartId) => void;
  interactive?: boolean;
  cartridgeOut?: number; // 0 inside … 1 fully out (target)
  electrodeOut?: number; // 0 inserted … 1 pulled out of the side port
  flapOpen?: number; // 0 closed … 1 open
  led?: LedState;
  scanning?: boolean;
  screen?: string[];
  /** mutable strip state; bump `.v` to trigger a redraw */
  strip?: RefObject<StripState & { v: number }>;
  labels?: boolean;
  /** world-space registry so cameras can fly to parts */
  registry?: RefObject<Partial<Record<PartId, THREE.Object3D>>>;
}

interface Ctx {
  explode: RefObject<number>;
  hovered: PartId | null;
  selected: PartId | null;
  interactive: boolean;
  onHover?: (id: PartId | null) => void;
  onSelect?: (id: PartId) => void;
  registry?: DeviceProps["registry"];
}

const DeviceCtx = createContext<Ctx>(null!);
const BOTTOM_EXPLODE: [number, number, number] = [0, -1.45, 0];
const ACCENT = new THREE.Color("#4fe3c1");

/* ------------------------------------------------------------------ */
/* Part wrapper: explode offset + hover / select highlight             */
/* ------------------------------------------------------------------ */

type MatRec = { m: THREE.MeshStandardMaterial; base: THREE.Color; bi: number };

function Part({ id, children, offset }: { id: PartId; children: ReactNode; offset?: [number, number, number] }) {
  const ctx = useContext(DeviceCtx);
  const part = getPart(id);
  const ex = offset ?? part.explode;
  const g = useRef<THREE.Group>(null!);
  const mats = useRef<MatRec[]>([]);
  const k = useRef(0);

  useLayoutEffect(() => {
    const recs: MatRec[] = [];
    g.current.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || mesh.userData.noHighlight) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      if (!m || !("emissive" in m)) return;
      recs.push({ m, base: m.emissive.clone(), bi: m.emissiveIntensity });
    });
    mats.current = recs;
    if (ctx.registry?.current && !offset) ctx.registry.current[id] = g.current;
  }, [ctx.registry, id, offset]);

  useFrame((_, dt) => {
    const e = ctx.explode.current ?? 0;
    g.current.position.set(ex[0] * e, ex[1] * e, ex[2] * e);
    const on = ctx.hovered === id || ctx.selected === id ? 1 : 0;
    k.current = THREE.MathUtils.damp(k.current, on, 8, dt);
    const kk = k.current;
    for (const r of mats.current) {
      r.m.emissive.copy(r.base).lerp(ACCENT, kk * 0.55);
      r.m.emissiveIntensity = r.bi + kk * 0.5;
    }
  });

  const handlers = ctx.interactive
    ? {
        onPointerOver: (e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          ctx.onHover?.(id);
          document.body.style.cursor = "pointer";
        },
        onPointerOut: () => {
          ctx.onHover?.(null);
          document.body.style.cursor = "";
        },
        onClick: (e: ThreeEvent<MouseEvent>) => {
          e.stopPropagation();
          if (e.delta > 6) return; // was a drag
          ctx.onSelect?.(id);
        },
      }
    : {};

  return (
    <group ref={g} {...handlers}>
      {children}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Small textures                                                      */
/* ------------------------------------------------------------------ */

function useScreenTexture(lines: string[]) {
  const { canvas, tex } = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 128;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return { canvas, tex };
  }, []);
  useEffect(() => {
    const c = canvas.getContext("2d")!;
    c.fillStyle = "#02060a";
    c.fillRect(0, 0, 256, 128);
    c.textBaseline = "top";
    lines.forEach((l, i) => {
      c.fillStyle = i === 0 ? "#4fe3c1" : "#d9f7ef";
      c.font = i === 1 ? "700 30px ui-monospace, monospace" : "500 17px ui-monospace, monospace";
      c.fillText(l, 12, i === 0 ? 10 : i === 1 ? 40 : 40 + 34 + (i - 2) * 22);
    });
    // scan-line texture for an OLED feel
    c.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < 128; y += 3) c.fillRect(0, y, 256, 1);
    tex.needsUpdate = true;
  }, [lines, canvas, tex]);
  return tex;
}

/* ------------------------------------------------------------------ */
/* Label positions for the exploded view                               */
/* ------------------------------------------------------------------ */

const LABELS: Partial<Record<PartId, { anchor: [number, number, number]; pos: [number, number, number] }>> = {
  enclosure: { anchor: [1.3, 2.56, -0.4], pos: [2.75, 2.85, -0.4] },
  status: { anchor: [-1.05, 2.57, 0.62], pos: [-2.75, 2.85, 0.62] },
  display: { anchor: [-1.25, 1.97, -0.1], pos: [-2.75, 1.95, -0.1] },
  optics: { anchor: [1.2, 1.33, 0.05], pos: [2.75, 1.5, 0.05] },
  sensing: { anchor: [0.95, 0.93, 0.8], pos: [2.75, 0.8, 0.8] },
  cartridge: { anchor: [0.45, 0.6, 1.2], pos: [-2.75, 0.75, 1.2] },
  electrode: { anchor: [2.45, 0.27, -0.3], pos: [3.05, -0.25, -0.3] },
  mcu: { anchor: [-0.95, -0.2, -0.1], pos: [-2.75, -0.35, -0.1] },
  adc: { anchor: [0.45, -0.22, -0.45], pos: [2.75, -0.7, -0.45] },
  battery: { anchor: [-0.55, -1.08, 0.35], pos: [-2.75, -1.2, 0.35] },
};

/* ------------------------------------------------------------------ */
/* Device                                                              */
/* ------------------------------------------------------------------ */

export function Device({
  explode = 0,
  hovered = null,
  selected = null,
  onHover,
  onSelect,
  interactive = false,
  cartridgeOut = 0,
  electrodeOut = 0,
  flapOpen = 0,
  led = "off",
  scanning = false,
  screen = ["NANOFOOD KIT", "READY", "Insert cartridge"],
  strip,
  labels = false,
  registry,
}: DeviceProps) {
  const explodeRef = useRef(0);
  const cartRef = useRef<THREE.Group>(null!);
  const flapRef = useRef<THREE.Group>(null!);
  const cartZ = useRef(cartridgeOut);
  const elecRef = useRef<THREE.Group>(null!);
  const elecX = useRef(electrodeOut);
  const flapA = useRef(flapOpen);
  const beams = useRef<THREE.Group>(null!);
  const glow = useRef<THREE.MeshStandardMaterial>(null!);
  const scanBar = useRef<THREE.Mesh>(null!);
  const ledTest = useRef<THREE.MeshStandardMaterial>(null!);
  const ledLink = useRef<THREE.MeshStandardMaterial>(null!);
  const labelGroup = useRef<THREE.Group>(null!);
  const screenTex = useScreenTexture(screen);

  const stripTex = useMemo(() => createStripTexture(), []);
  const lastV = useRef(-1);

  // draw an initial (dry) strip
  useEffect(() => {
    stripTex.draw(strip?.current ?? { flow: 0, sampleTint: "#dcd6c4", zoneColor: {}, dropped: false });
  }, [stripTex, strip]);

  useEffect(() => () => stripTex.texture.dispose(), [stripTex]);

  useFrame((state, dt) => {
    explodeRef.current = THREE.MathUtils.damp(explodeRef.current, explode, 3.2, dt);
    const e = explodeRef.current;

    cartZ.current = THREE.MathUtils.damp(cartZ.current, cartridgeOut, 3, dt);
    cartRef.current.position.z = cartZ.current * 1.75;
    elecX.current = THREE.MathUtils.damp(elecX.current, electrodeOut, 3, dt);
    elecRef.current.position.x = elecX.current * 1.3;
    flapA.current = THREE.MathUtils.damp(flapA.current, flapOpen, 6, dt);
    flapRef.current.rotation.x = -flapA.current * 1.45;

    const t = state.clock.elapsedTime;
    // beams visible in exploded view or while scanning
    const beamK = Math.max(e > 0.5 ? (e - 0.5) * 2 : 0, scanning ? 1 : 0);
    beams.current.visible = beamK > 0.02;
    beams.current.children.forEach((c) => {
      const m = (c as THREE.Mesh).material as THREE.MeshBasicMaterial;
      m.opacity = 0.18 * beamK * (0.75 + 0.25 * Math.sin(t * 6));
    });

    glow.current.emissiveIntensity = scanning ? 1.2 + Math.sin(t * 10) * 0.5 : 0.12 + Math.sin(t * 1.5) * 0.04;
    scanBar.current.visible = scanning;
    scanBar.current.position.z = 0.05 + Math.sin(t * 3) * 0.5;

    const testColor = led === "busy" ? "#ffb13b" : led === "pass" ? "#5be38a" : led === "fail" ? "#ff5b4d" : "#1a1f24";
    ledTest.current.emissive.set(testColor);
    ledTest.current.emissiveIntensity = led === "busy" ? 1.5 + Math.sin(t * 8) : led === "off" ? 0 : 2.2;
    ledLink.current.emissiveIntensity = 1 + Math.sin(t * 2.4) * 0.8;

    if (labelGroup.current) labelGroup.current.visible = e > 0.85;

    if (strip?.current && strip.current.v !== lastV.current) {
      lastV.current = strip.current.v;
      stripTex.draw(strip.current);
    }
  });

  const ctx: Ctx = { explode: explodeRef, hovered, selected, interactive, onHover, onSelect, registry };

  return (
    <DeviceCtx.Provider value={ctx}>
      <group>
        {/* ---------------- Enclosure ---------------- */}
        <Part id="enclosure">
          {/* top shell */}
          <RoundedBox args={[3.2, 0.42, 2.0]} radius={0.16} smoothness={5} position={[0, 0.19, 0]}>
            <meshPhysicalMaterial color="#e6e9ec" roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.35} />
          </RoundedBox>
          {/* chamber viewing window */}
          <RoundedBox args={[1.12, 0.03, 1.3]} radius={0.012} position={[0.75, 0.4, 0.02]}>
            <meshPhysicalMaterial color="#0b1116" roughness={0.08} metalness={0.2} clearcoat={1} />
          </RoundedBox>
          <mesh position={[0.75, 0.418, 0.02]} rotation-x={-Math.PI / 2} userData={{ noHighlight: true }}>
            <planeGeometry args={[1.0, 1.18]} />
            <meshStandardMaterial ref={glow} color="#071512" emissive="#4fe3c1" emissiveIntensity={0.35} transparent opacity={0.35} />
          </mesh>
          <mesh ref={scanBar} position={[0.75, 0.42, 0]} rotation-x={-Math.PI / 2} userData={{ noHighlight: true }}>
            <planeGeometry args={[1.0, 0.05]} />
            <meshBasicMaterial color="#9ffff0" transparent opacity={0.9} toneMapped={false} />
          </mesh>
          {/* engraved ring around the test button */}
          <mesh position={[-0.3, 0.405, 0.6]} rotation-x={-Math.PI / 2} userData={{ noHighlight: true }}>
            <ringGeometry args={[0.12, 0.14, 40]} />
            <meshStandardMaterial color="#4fe3c1" emissive="#4fe3c1" emissiveIntensity={0.9} toneMapped={false} />
          </mesh>
          <mesh position={[-0.3, 0.42, 0.6]}>
            <cylinderGeometry args={[0.1, 0.1, 0.04, 32]} />
            <meshPhysicalMaterial color="#d7dce0" roughness={0.3} clearcoat={1} />
          </mesh>
          {/* accent seam */}
          <mesh position={[0, 0, 0]} userData={{ noHighlight: true }}>
            <boxGeometry args={[3.12, 0.025, 1.93]} />
            <meshStandardMaterial color="#0c2a24" emissive="#4fe3c1" emissiveIntensity={0.35} />
          </mesh>
        </Part>
        <Part id="enclosure" offset={BOTTOM_EXPLODE}>
          {/* bottom shell */}
          <RoundedBox args={[3.2, 0.42, 2.0]} radius={0.16} smoothness={5} position={[0, -0.19, 0]}>
            <meshStandardMaterial color="#2a3037" roughness={0.62} metalness={0.1} />
          </RoundedBox>
          {/* front cartridge slot */}
          <RoundedBox args={[0.78, 0.16, 0.04]} radius={0.02} position={[0.75, 0.04, 0.99]}>
            <meshStandardMaterial color="#06090c" roughness={0.9} />
          </RoundedBox>
          <group ref={flapRef} position={[0.75, 0.11, 1.015]}>
            <mesh position={[0, -0.065, 0]}>
              <boxGeometry args={[0.7, 0.12, 0.015]} />
              <meshStandardMaterial color="#1c232a" roughness={0.5} />
            </mesh>
          </group>
          {/* side electrode port */}
          <RoundedBox args={[0.04, 0.07, 0.44]} radius={0.01} position={[1.6, 0.02, -0.3]}>
            <meshStandardMaterial color="#06090c" roughness={0.9} />
          </RoundedBox>
          {/* USB-C port at the back */}
          <RoundedBox args={[0.2, 0.07, 0.04]} radius={0.03} position={[-1.0, -0.12, -1.0]}>
            <meshStandardMaterial color="#9aa3ab" metalness={1} roughness={0.35} />
          </RoundedBox>
          {/* feet */}
          {[
            [-1.3, -0.8],
            [1.3, -0.8],
            [-1.3, 0.8],
            [1.3, 0.8],
          ].map(([x, z], i) => (
            <mesh key={i} position={[x, -0.41, z]}>
              <cylinderGeometry args={[0.1, 0.1, 0.03, 20]} />
              <meshStandardMaterial color="#111" roughness={1} />
            </mesh>
          ))}
        </Part>

        {/* ---------------- Status LEDs ---------------- */}
        <Part id="status">
          {[
            { x: -1.2, c: "#5be38a", ref: undefined as RefObject<THREE.MeshStandardMaterial | null> | undefined, i: 1.6 },
            { x: -1.02, c: "#6aa8ff", ref: ledLink, i: 1 },
            { x: -0.84, c: "#1a1f24", ref: ledTest, i: 0 },
          ].map((l, i) => (
            <group key={i} position={[l.x, 0.405, 0.62]}>
              <mesh userData={{ noHighlight: true }}>
                <cylinderGeometry args={[0.045, 0.045, 0.03, 20]} />
                <meshStandardMaterial ref={l.ref} color="#222" emissive={l.c} emissiveIntensity={l.i} toneMapped={false} />
              </mesh>
              <mesh position={[0, -0.005, 0]}>
                <cylinderGeometry args={[0.06, 0.06, 0.02, 20]} />
                <meshStandardMaterial color="#b9c0c6" metalness={0.6} roughness={0.3} />
              </mesh>
            </group>
          ))}
        </Part>

        {/* ---------------- OLED display ---------------- */}
        <Part id="display">
          <RoundedBox args={[1.2, 0.03, 0.72]} radius={0.012} position={[-0.75, 0.405, -0.15]}>
            <meshPhysicalMaterial color="#0a0e12" roughness={0.1} clearcoat={1} />
          </RoundedBox>
          <mesh position={[-0.75, 0.422, -0.15]} rotation-x={-Math.PI / 2} userData={{ noHighlight: true }}>
            <planeGeometry args={[0.98, 0.49]} />
            <meshBasicMaterial map={screenTex} toneMapped={false} />
          </mesh>
          {/* module PCB underneath (visible when exploded) */}
          <mesh position={[-0.75, 0.37, -0.15]}>
            <boxGeometry args={[1.1, 0.03, 0.66]} />
            <meshStandardMaterial color="#123a6b" roughness={0.6} />
          </mesh>
        </Part>

        {/* ---------------- Optical head ---------------- */}
        <Part id="optics">
          <RoundedBox args={[1.0, 0.13, 0.55]} radius={0.03} position={[0.75, 0.28, 0.05]}>
            <meshStandardMaterial color="#14181c" roughness={0.7} />
          </RoundedBox>
          {/* LEDs: white + RGB */}
          {[
            { x: 0.43, c: "#ffffff" },
            { x: 0.58, c: "#ff4d4d" },
            { x: 0.73, c: "#4dff88" },
            { x: 0.88, c: "#4d8bff" },
          ].map((l, i) => (
            <mesh key={i} position={[l.x, 0.2, 0.05]} userData={{ noHighlight: true }}>
              <sphereGeometry args={[0.045, 16, 16]} />
              <meshStandardMaterial color="#fff" emissive={l.c} emissiveIntensity={1.8} toneMapped={false} />
            </mesh>
          ))}
          {/* BPW34 photodiode */}
          <mesh position={[1.08, 0.205, 0.05]}>
            <boxGeometry args={[0.14, 0.02, 0.14]} />
            <meshStandardMaterial color="#1b2530" metalness={0.4} roughness={0.2} />
          </mesh>
          <mesh position={[1.08, 0.194, 0.05]} rotation-x={Math.PI / 2}>
            <planeGeometry args={[0.1, 0.1]} />
            <meshStandardMaterial color="#6d7f8f" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* illumination beams */}
          <group ref={beams} visible={false}>
            {[0.43, 0.58, 0.73, 0.88].map((x, i) => (
              <mesh key={i} position={[x, -0.05, 0.05]} userData={{ noHighlight: true }}>
                <coneGeometry args={[0.16, 0.5, 24, 1, true]} />
                <meshBasicMaterial
                  color={["#ffffff", "#ff6b6b", "#6bff9e", "#6ba0ff"][i]}
                  transparent
                  opacity={0}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                  side={THREE.DoubleSide}
                />
              </mesh>
            ))}
          </group>
        </Part>

        {/* ---------------- Cartridge (holder + strip) ---------------- */}
        <group ref={cartRef}>
          <Part id="cartridge">
            <group position={[0.75, 0.06, 0.25]} rotation-x={-0.07}>
              <RoundedBox args={[0.66, 0.07, 1.5]} radius={0.025}>
                <meshPhysicalMaterial color="#5b7b86" roughness={0.55} clearcoat={0.2} />
              </RoundedBox>
              {/* pull tab */}
              <RoundedBox args={[0.5, 0.1, 0.16]} radius={0.03} position={[0, 0.01, 0.8]}>
                <meshPhysicalMaterial color="#4fe3c1" roughness={0.4} />
              </RoundedBox>
            </group>
          </Part>
          <Part id="sensing">
            <mesh position={[0.75, 0.1, 0.24]} rotation={[-Math.PI / 2 - 0.07, 0, 0]}>
              <planeGeometry args={[0.44, 1.32]} />
              <meshStandardMaterial map={stripTex.texture} roughness={0.95} />
            </mesh>
          </Part>
        </group>

        {/* ---------------- SPCE electrode ---------------- */}
        <group ref={elecRef}>
        <Part id="electrode">
          <group position={[1.3, 0.02, -0.3]}>
            <mesh>
              <boxGeometry args={[1.0, 0.015, 0.3]} />
              <meshStandardMaterial color="#eef0ea" roughness={0.8} />
            </mesh>
            {/* working electrode (Ag/GO modified) */}
            <mesh position={[-0.28, 0.01, 0]} rotation-x={-Math.PI / 2}>
              <circleGeometry args={[0.07, 32]} />
              <meshStandardMaterial color="#15171a" roughness={0.6} metalness={0.3} />
            </mesh>
            {/* counter electrode arc */}
            <mesh position={[-0.28, 0.009, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.095, 0.12, 32, 1, 0.3, 4.2]} />
              <meshStandardMaterial color="#3a3d42" roughness={0.6} />
            </mesh>
            {/* Ag/AgCl reference */}
            <mesh position={[-0.28, 0.009, 0]} rotation-x={-Math.PI / 2}>
              <ringGeometry args={[0.095, 0.12, 16, 1, 4.7, 1.2]} />
              <meshStandardMaterial color="#c7cdd3" metalness={0.9} roughness={0.25} />
            </mesh>
            {/* printed tracks */}
            {[-0.07, 0, 0.07].map((z, i) => (
              <mesh key={i} position={[0.15, 0.009, z]}>
                <boxGeometry args={[0.6, 0.002, 0.025]} />
                <meshStandardMaterial color={i === 1 ? "#c7cdd3" : "#2b2e33"} metalness={i === 1 ? 0.8 : 0.1} roughness={0.4} />
              </mesh>
            ))}
          </group>
        </Part>
        </group>

        {/* ---------------- Main PCB: ESP32 ---------------- */}
        <Part id="mcu">
          <mesh position={[0, -0.12, 0]}>
            <boxGeometry args={[2.9, 0.035, 1.7]} />
            <meshStandardMaterial color="#0f3a2b" roughness={0.55} />
          </mesh>
          <group position={[-0.55, -0.085, -0.1]}>
            <mesh>
              <boxGeometry args={[1.15, 0.03, 0.5]} />
              <meshStandardMaterial color="#121418" roughness={0.6} />
            </mesh>
            {/* shielded module */}
            <mesh position={[0.25, 0.04, 0]}>
              <boxGeometry args={[0.36, 0.05, 0.42]} />
              <meshStandardMaterial color="#c9ced3" metalness={1} roughness={0.3} />
            </mesh>
            {/* antenna area */}
            <mesh position={[0.5, 0.02, 0]}>
              <boxGeometry args={[0.13, 0.012, 0.42]} />
              <meshStandardMaterial color="#0d2f4f" roughness={0.5} />
            </mesh>
            {/* pin headers */}
            {[-0.23, 0.23].map((z, i) => (
              <mesh key={i} position={[-0.05, 0.035, z]}>
                <boxGeometry args={[1.05, 0.05, 0.04]} />
                <meshStandardMaterial color="#0b0b0b" roughness={0.8} />
              </mesh>
            ))}
            <mesh position={[-0.35, 0.03, 0]}>
              <boxGeometry args={[0.14, 0.04, 0.12]} />
              <meshStandardMaterial color="#1b1b1b" />
            </mesh>
          </group>
          {/* copper traces hint */}
          {[
            [0.2, -0.1, 0.1, 1.2],
            [0.6, -0.1, 0.3, 0.7],
            [-1.0, -0.1, 0.6, 0.6],
          ].map(([x, y, z, w], i) => (
            <mesh key={i} position={[x, y, z]} userData={{ noHighlight: true }}>
              <boxGeometry args={[w, 0.004, 0.02]} />
              <meshStandardMaterial color="#c89b3c" metalness={1} roughness={0.35} emissive="#4fe3c1" emissiveIntensity={0.05} />
            </mesh>
          ))}
        </Part>

        {/* ---------------- ADS1115 ---------------- */}
        <Part id="adc">
          <group position={[0.35, -0.092, -0.45]}>
            <mesh>
              <boxGeometry args={[0.4, 0.03, 0.3]} />
              <meshStandardMaterial color="#3a2a73" roughness={0.55} />
            </mesh>
            <mesh position={[0, 0.025, 0]}>
              <boxGeometry args={[0.12, 0.025, 0.1]} />
              <meshStandardMaterial color="#111" roughness={0.4} />
            </mesh>
          </group>
        </Part>

        {/* ---------------- Battery + TP4056 ---------------- */}
        <Part id="battery">
          <group position={[-0.2, -0.27, 0.45]} rotation-z={Math.PI / 2}>
            <mesh>
              <cylinderGeometry args={[0.13, 0.13, 1.3, 40]} />
              <meshPhysicalMaterial color="#1b7488" roughness={0.3} clearcoat={0.8} />
            </mesh>
            <mesh position={[0, 0.66, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
              <meshStandardMaterial color="#c0c6cc" metalness={1} roughness={0.25} />
            </mesh>
            <mesh position={[0, -0.66, 0]}>
              <cylinderGeometry args={[0.12, 0.12, 0.03, 32]} />
              <meshStandardMaterial color="#c0c6cc" metalness={1} roughness={0.25} />
            </mesh>
          </group>
          <group position={[-1.2, -0.25, -0.55]}>
            <mesh>
              <boxGeometry args={[0.36, 0.03, 0.26]} />
              <meshStandardMaterial color="#1f4f9c" roughness={0.55} />
            </mesh>
            <mesh position={[-0.12, 0.03, 0]}>
              <boxGeometry args={[0.1, 0.05, 0.14]} />
              <meshStandardMaterial color="#aab2b9" metalness={1} roughness={0.3} />
            </mesh>
          </group>
        </Part>

        {/* ---------------- Exploded-view labels ---------------- */}
        {labels && (
          <group ref={labelGroup} visible={false}>
            {DEVICE_PARTS.map((p, i) => {
              const L = LABELS[p.id];
              if (!L) return null;
              return (
                <group key={p.id}>
                  <Line points={[L.anchor, L.pos]} color={selected === p.id || hovered === p.id ? "#4fe3c1" : "#6f7e8b"} lineWidth={1} transparent opacity={0.8} />
                  <mesh position={L.anchor}>
                    <sphereGeometry args={[0.035, 12, 12]} />
                    <meshBasicMaterial color="#4fe3c1" toneMapped={false} />
                  </mesh>
                  <Html position={L.pos} center zIndexRange={[20, 0]}>
                    <button
                      type="button"
                      onClick={() => onSelect?.(p.id)}
                      onPointerEnter={() => onHover?.(p.id)}
                      onPointerLeave={() => onHover?.(null)}
                      className={`mono whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] tracking-wider uppercase backdrop-blur transition-colors ${
                        selected === p.id || hovered === p.id
                          ? "border-nano bg-nano/20 text-nano"
                          : "border-line-2 bg-bg/70 text-text-2 hover:text-text"
                      }`}
                    >
                      {String(i + 1).padStart(2, "0")} · {p.name}
                    </button>
                  </Html>
                </group>
              );
            })}
          </group>
        )}
      </group>
    </DeviceCtx.Provider>
  );
}
