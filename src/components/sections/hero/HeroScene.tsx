"use client";
import { useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { easing } from "maath";
import { Device } from "@/components/three/device/Device";
import { StudioLights } from "@/components/three/StudioLights";
import { getPart, type PartId } from "@/content/device";
import { attachWindowPointer, windowPointer } from "@/lib/pointer";

export interface HeroSceneProps {
  explore: boolean;
  selected: PartId | null;
  hovered: PartId | null;
  onHover: (id: PartId | null) => void;
  onSelect: (id: PartId | null) => void;
}

const tmp = new THREE.Vector3();

function Rig({ explore, selected, hovered, onHover, onSelect }: HeroSceneProps) {
  const stage = useRef<THREE.Group>(null!);
  const look = useRef(new THREE.Vector3(0, 0.1, 0));
  const registry = useRef<Partial<Record<PartId, THREE.Object3D>>>({});
  const drag = useRef({ active: false, x: 0, y: 0, yaw: -0.55, pitch: 0.15 });
  const { size, gl, camera } = useThree();
  const wide = size.width >= 1024;

  useEffect(() => attachWindowPointer(), []);

  // drag-to-rotate while exploring
  useEffect(() => {
    const el = gl.domElement;
    const down = (e: PointerEvent) => {
      if (!explore) return;
      drag.current.active = true;
      drag.current.x = e.clientX;
      drag.current.y = e.clientY;
    };
    const move = (e: PointerEvent) => {
      const d = drag.current;
      if (!d.active) return;
      d.yaw += (e.clientX - d.x) * 0.006;
      d.pitch = THREE.MathUtils.clamp(d.pitch + (e.clientY - d.y) * 0.004, -0.4, 0.9);
      d.x = e.clientX;
      d.y = e.clientY;
    };
    const up = () => (drag.current.active = false);
    el.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [gl, explore]);

  useEffect(() => {
    if (explore) {
      drag.current.yaw = -0.45;
      drag.current.pitch = 0.12;
    }
  }, [explore]);

  useFrame((state, dt) => {
    const p = windowPointer;
    const t = state.clock.elapsedTime;
    const focused = !!selected;

    // stage placement: right of the headline on desktop, below it on mobile
    const sx = explore || focused ? 0 : wide ? 1.75 : 0;
    const sy = explore || focused ? 0 : wide ? -0.05 : -2.35;
    const sc = wide ? 1 : 0.62;
    easing.damp3(stage.current.position, [sx, sy + (explore ? 0 : Math.sin(t * 0.8) * 0.04), 0], 0.6, dt);
    easing.damp3(stage.current.scale, [sc, sc, sc], 0.5, dt);

    const yaw = explore ? drag.current.yaw : -0.6 + p.x * 0.3;
    const pitch = explore ? drag.current.pitch : 0.05 - p.y * 0.05;
    easing.dampE(stage.current.rotation, [pitch, yaw, 0], focused ? 1.2 : 0.35, dt);

    // camera
    let camTarget: [number, number, number];
    if (focused) {
      const obj = registry.current[selected!];
      const part = getPart(selected!);
      if (obj) obj.localToWorld(tmp.set(...part.focus));
      else tmp.set(0, 0, 0);
      easing.damp3(look.current, tmp, 0.45, dt);
      camTarget = [tmp.x + 0.35, tmp.y + 1.6, tmp.z + 2.9];
    } else if (explore) {
      easing.damp3(look.current, [0, 0.3, 0], 0.5, dt);
      camTarget = [p.x * 0.4, 1.6 + p.y * 0.4, wide ? 11.2 : 15];
    } else {
      easing.damp3(look.current, [0, 0.05, 0], 0.5, dt);
      camTarget = [p.x * 0.25, 2.5 + p.y * 0.8, wide ? 8.8 : 10.5];
    }
    easing.damp3(camera.position, camTarget, focused ? 0.55 : 0.45, dt);
    camera.lookAt(look.current);
  });

  return (
    <group ref={stage}>
      <Device
        explode={explore ? 1 : 0}
        interactive
        hovered={hovered}
        selected={selected}
        onHover={onHover}
        onSelect={(id) => onSelect(id)}
        labels={explore}
        led="off"
        screen={["NANOFOOD KIT", "READY", "Insert cartridge", "DEMO UI"]}
        registry={registry}
      />
      <ContactShadows position={[0, -0.44, 0]} opacity={explore ? 0.2 : 0.55} scale={9} blur={2.6} far={3} color="#000" />
    </group>
  );
}

export default function HeroScene(props: HeroSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 2.4, 7.4], fov: 32 }}
      gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
      onPointerMissed={(e) => {
        // clicks on HTML labels bubble to the canvas container; only a click
        // on empty canvas space should clear the selection
        if ((e.target as HTMLElement)?.tagName === "CANVAS") props.onSelect(null);
      }}
    >
      <StudioLights />
      <pointLight position={[-2.5, 1.5, 2.5]} color="#4fe3c1" intensity={1.2} distance={6} />
      <Rig {...props} />
    </Canvas>
  );
}
