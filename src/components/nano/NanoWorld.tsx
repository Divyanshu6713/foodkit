"use client";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { NanoMode } from "@/content/research";
import { band, mulberry32, smooth } from "@/lib/color";
import { LeadIon, Peroxide, SPHERE, Surfactant, Triiodide, Urea } from "./molecules";

/**
 * Conceptual nanoscale scenes for each sensing chemistry in the research.
 * Driven by a 0..1 `progress` ref:
 *   0.00–0.45  target analyte approaches the sensing surface
 *   0.40–0.90  interaction → nanomaterial / indicator response
 * `positive=false` shows the same scene with no analyte (clean sample).
 * Not to scale; colors and motion are illustrative.
 */

export interface NanoWorldProps {
  mode: NanoMode;
  progress: RefObject<number>;
  positive?: boolean;
  /** GO-only variant of the electrode scene (no Ag particles) */
  goOnly?: boolean;
  spin?: boolean;
}

export const LEGENDS: Record<NanoMode | "go", { color: string; label: string }[]> = {
  agnp: [
    { color: "#d8dee6", label: "AgNP (citrate-capped)" },
    { color: "#5b86ff", label: "Urea molecule" },
    { color: "#e9c64a", label: "SPR glow: dispersed (yellow)" },
    { color: "#5b6f9e", label: "SPR glow: aggregated (blue-shift)" },
  ],
  aggo: [
    { color: "#2a6f6a", label: "Graphene-oxide sheet" },
    { color: "#d8dee6", label: "Ag nanoparticle" },
    { color: "#5b86ff", label: "Urea molecule" },
    { color: "#4fe3c1", label: "Electron → current" },
  ],
  go: [
    { color: "#2a6f6a", label: "Graphene-oxide sheet" },
    { color: "#ff5a52", label: "–OH / –COOH groups" },
    { color: "#5b86ff", label: "Analyte" },
    { color: "#4fe3c1", label: "Electron transfer" },
  ],
  starch: [
    { color: "#d9b36a", label: "Amylose helix (starch)" },
    { color: "#8b3fd1", label: "Triiodide I₃⁻ (reagent)" },
    { color: "#1c2146", label: "Blue-black complex" },
  ],
  btb: [
    { color: "#e9e1c9", label: "Cellulose fibre (paper)" },
    { color: "#c9cf6a", label: "pH indicator (neutral)" },
    { color: "#5bd0ff", label: "Detergent surfactant" },
    { color: "#2f6fc4", label: "Indicator response (blue)" },
  ],
  guaiacol: [
    { color: "#7a5ba8", label: "Peroxidase enzyme" },
    { color: "#ff5a52", label: "H₂O₂ molecule" },
    { color: "#efe6d6", label: "Guaiacol" },
    { color: "#9b2a1f", label: "Tetraguaiacol (red)" },
  ],
  dithizone: [
    { color: "#e8b04b", label: "AuNP" },
    { color: "#e7c93a", label: "Dithizone ligand" },
    { color: "#8fa2b8", label: "Pb²⁺ ion" },
    { color: "#b3262a", label: "Pb–dithizone complex (red)" },
  ],
};

const COLORS: Record<NanoMode, [string, string]> = {
  agnp: ["#e9c64a", "#5b6f9e"],
  aggo: ["#1b2530", "#4fe3c1"],
  starch: ["#d9b36a", "#1c2146"],
  btb: ["#c9cf6a", "#2f6fc4"],
  guaiacol: ["#efe6d6", "#9b2a1f"],
  dithizone: ["#3f6b4a", "#b3262a"],
};

const v3 = () => new THREE.Vector3();
const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _s = new THREE.Vector3();
const _p = new THREE.Vector3();
const UP = new THREE.Vector3(0, 1, 0);
const _d = new THREE.Vector3();

function randomUnit(r: () => number) {
  const u = r() * 2 - 1;
  const t = r() * Math.PI * 2;
  const s = Math.sqrt(1 - u * u);
  return new THREE.Vector3(s * Math.cos(t), u, s * Math.sin(t));
}

/* ------------------------------------------------------------------ */
/* Aggregation: AgNP (urea) and dithizone-AuNP (lead)                  */
/* ------------------------------------------------------------------ */

function Aggregation({ progress, positive, metal }: { progress: RefObject<number>; positive: boolean; metal: "ag" | "au" }) {
  const N = 26;
  const A = 20;
  const aggStrength = metal === "ag" ? 1 : 0.4;
  const [from, to] = metal === "ag" ? COLORS.agnp : COLORS.dithizone;
  const cores = useRef<THREE.InstancedMesh>(null!);
  const halos = useRef<THREE.InstancedMesh>(null!);
  const haloMat = useRef<THREE.MeshBasicMaterial>(null!);
  const ligands = useRef<THREE.InstancedMesh>(null!);
  const analytes = useRef<(THREE.Group | null)[]>([]);
  const cFrom = useMemo(() => new THREE.Color(from), [from]);
  const cTo = useMemo(() => new THREE.Color(to), [to]);
  const LIG = 10;

  const data = useMemo(() => {
    const r = mulberry32(metal === "ag" ? 11 : 23);
    const centers = [v3().set(-1.7, 0.5, 0), v3().set(1.5, -0.5, 0.4), v3().set(0.2, 1.3, -1), v3().set(-0.3, -1.3, 0.9)];
    const offs = [v3(), v3().set(0.52, 0, 0), v3().set(-0.52, 0, 0), v3().set(0, 0.52, 0), v3().set(0, -0.52, 0), v3().set(0, 0, 0.52), v3().set(0.3, 0.3, -0.45)];
    const disp = Array.from({ length: N }, () => v3().set((r() - 0.5) * 7.5, (r() - 0.5) * 4.2, (r() - 0.5) * 4));
    const clus = Array.from({ length: N }, (_, i) => centers[i % 4].clone().add(offs[Math.floor(i / 4) % offs.length]));
    const phase = Array.from({ length: N }, () => r() * 10);
    const start = Array.from({ length: A }, () => randomUnit(r).multiplyScalar(6 + r() * 2));
    const bind = Array.from({ length: A }, () => randomUnit(r).multiplyScalar(0.42));
    const ligDirs = Array.from({ length: LIG }, () => randomUnit(r));
    // each particle gets its own orientation so ligand shells don't all line up
    const spin = Array.from({ length: N }, () => new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 6.28, r() * 6.28, r() * 6.28)));
    return { disp, clus, phase, start, bind, ligDirs, spin };
  }, [metal]);

  const npPos = useMemo(() => Array.from({ length: N }, () => v3()), []);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;
    const agg = positive ? smooth(band(p, 0.42, 0.88)) * aggStrength : 0;
    for (let i = 0; i < N; i++) {
      const d = data.disp[i];
      const ph = data.phase[i];
      const j = (1 - agg) * 0.12;
      _p.set(d.x + Math.sin(t * 0.7 + ph) * j * 2, d.y + Math.cos(t * 0.9 + ph) * j * 2, d.z + Math.sin(t * 0.5 + ph * 2) * j * 2);
      npPos[i].copy(_p).lerp(data.clus[i], agg);
      _m.compose(npPos[i], _q.identity(), _s.setScalar(0.26));
      cores.current.setMatrixAt(i, _m);
      _m.compose(npPos[i], _q, _s.setScalar(0.4 + agg * 0.12));
      halos.current.setMatrixAt(i, _m);
      if (ligands.current) {
        for (let k = 0; k < LIG; k++) {
          const dir = _d.copy(data.ligDirs[k]).applyQuaternion(data.spin[i]);
          _q.setFromUnitVectors(UP, dir);
          _p.copy(npPos[i]).addScaledVector(dir, 0.34);
          _m.compose(_p, _q, _s.set(0.018, 0.16, 0.018));
          ligands.current.setMatrixAt(i * LIG + k, _m);
        }
        _q.identity();
      }
    }
    cores.current.instanceMatrix.needsUpdate = true;
    halos.current.instanceMatrix.needsUpdate = true;
    if (ligands.current) ligands.current.instanceMatrix.needsUpdate = true;
    const colorK = positive ? smooth(band(p, 0.45, 0.9)) : 0;
    haloMat.current.color.copy(cFrom).lerp(cTo, colorK);
    haloMat.current.opacity = 0.16 + 0.04 * Math.sin(t * 2);

    const arrive = smooth(band(p, 0.02, 0.45));
    for (let a = 0; a < A; a++) {
      const g = analytes.current[a];
      if (!g) continue;
      g.visible = positive && p > 0.001;
      const np = npPos[a % N];
      _p.copy(np).add(data.bind[a]);
      g.position.copy(data.start[a]).lerp(_p, arrive);
      g.rotation.set(t * 0.6 + a, t * 0.4 + a * 2, 0);
    }
  });

  const Analyte = metal === "ag" ? Urea : LeadIon;
  return (
    <group>
      <instancedMesh ref={cores} args={[SPHERE, undefined, N]}>
        <meshStandardMaterial color={metal === "ag" ? "#cfd6de" : "#e8b04b"} metalness={0.85} roughness={0.42} envMapIntensity={0.6} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[SPHERE, undefined, N]}>
        <meshBasicMaterial ref={haloMat} color={from} transparent opacity={0.25} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      {metal === "au" && (
        <instancedMesh ref={ligands} args={[undefined, undefined, N * LIG]}>
          <cylinderGeometry args={[1, 1, 1, 6]} />
          <meshStandardMaterial color="#e7c93a" emissive="#e7c93a" emissiveIntensity={0.3} />
        </instancedMesh>
      )}
      {Array.from({ length: A }, (_, a) => (
        <Analyte key={a} ref={(el: THREE.Group | null) => { analytes.current[a] = el; }} visible={false} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Electrode: Ag/GO (or GO) with electron transfer                     */
/* ------------------------------------------------------------------ */

function hexTexture() {
  const c = document.createElement("canvas");
  c.width = 512;
  c.height = 512;
  const x = c.getContext("2d")!;
  x.fillStyle = "#08171a";
  x.fillRect(0, 0, 512, 512);
  x.strokeStyle = "rgba(79,227,193,0.55)";
  x.lineWidth = 2;
  const s = 16;
  const h = Math.sqrt(3) * s;
  for (let row = -1; row < 512 / h + 1; row++) {
    for (let col = -1; col < 512 / (1.5 * s) + 1; col++) {
      const cx = col * 1.5 * s;
      const cy = row * h + (col % 2 ? h / 2 : 0);
      x.beginPath();
      for (let k = 0; k < 6; k++) {
        const a = (Math.PI / 3) * k;
        const px = cx + s * Math.cos(a);
        const py = cy + s * Math.sin(a);
        if (k === 0) x.moveTo(px, py);
        else x.lineTo(px, py);
      }
      x.closePath();
      x.stroke();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function Electrode({ progress, positive, goOnly }: { progress: RefObject<number>; positive: boolean; goOnly: boolean }) {
  const SITES = 14;
  const A = 14;
  const E = 70;
  const tex = useMemo(() => hexTexture(), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const sheetY = -1.3;

  const sheetGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(11, 7, 80, 50);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.7) * Math.cos(y * 0.6) * 0.18);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => sheetGeo.dispose(), [sheetGeo]);

  const data = useMemo(() => {
    const r = mulberry32(5);
    const sites = Array.from({ length: SITES }, () => v3().set((r() - 0.6) * 8, sheetY + 0.2, (r() - 0.5) * 5));
    const groups = Array.from({ length: 36 }, () => v3().set((r() - 0.5) * 10, sheetY + 0.08, (r() - 0.5) * 6));
    const start = Array.from({ length: A }, (_, i) => v3().set(sites[i % SITES].x + (r() - 0.5) * 2, 3 + r() * 2.5, sites[i % SITES].z + (r() - 0.5) * 2));
    const e = Array.from({ length: E }, (_, k) => ({ site: k % SITES, t0: 0.45 + (k / E) * 0.45, z: (r() - 0.5) * 0.5 }));
    return { sites, groups, start, e };
  }, [sheetY]);

  const mol = useRef<(THREE.Group | null)[]>([]);
  const elec = useRef<THREE.InstancedMesh>(null!);
  const flashes = useRef<THREE.InstancedMesh>(null!);
  const lead = useRef<THREE.MeshStandardMaterial>(null!);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;
    const arrive = smooth(band(p, 0.02, 0.45));
    const consume = band(p, 0.45, 0.6);
    for (let a = 0; a < A; a++) {
      const g = mol.current[a];
      if (!g) continue;
      g.visible = positive && p > 0.001 && consume < 1;
      g.position.copy(data.start[a]).lerp(data.sites[a % SITES], arrive);
      g.scale.setScalar(1 - consume);
      g.rotation.set(t * 0.5 + a, t * 0.3 + a, 0);
    }
    for (let s = 0; s < SITES; s++) {
      const f = positive ? Math.max(0, 1 - Math.abs(p - 0.5) * 12) : 0;
      _m.compose(data.sites[s], _q.identity(), _s.setScalar(f * 0.7));
      flashes.current.setMatrixAt(s, _m);
    }
    flashes.current.instanceMatrix.needsUpdate = true;
    let live = 0;
    for (let k = 0; k < E; k++) {
      const e = data.e[k];
      const u = positive ? (p - e.t0) / 0.14 : -1;
      if (u < 0 || u > 1) {
        _m.compose(_p.set(0, -99, 0), _q, _s.setScalar(0));
      } else {
        live++;
        const src = data.sites[e.site];
        const x = THREE.MathUtils.lerp(src.x, 5.3, u);
        const z = THREE.MathUtils.lerp(src.z, e.z, u) + Math.sin(u * 12 + k) * 0.1;
        _m.compose(_p.set(x, sheetY + 0.12 + Math.sin(u * Math.PI) * 0.15, z), _q, _s.setScalar(0.06));
      }
      elec.current.setMatrixAt(k, _m);
    }
    elec.current.instanceMatrix.needsUpdate = true;
    lead.current.emissiveIntensity = 0.1 + Math.min(1.5, live * 0.08) + Math.sin(t * 8) * 0.05 * (live > 0 ? 1 : 0);
  });

  return (
    <group>
      <mesh geometry={sheetGeo} rotation-x={-Math.PI / 2} position={[0, sheetY, 0]}>
        <meshStandardMaterial map={tex} color="#9fd8cc" emissive="#0d3a33" emissiveIntensity={0.6} roughness={0.7} side={THREE.DoubleSide} />
      </mesh>
      {/* oxygen functional groups */}
      <instancedMesh
        args={[SPHERE, undefined, data.groups.length]}
        ref={(m) => {
          if (!m) return;
          data.groups.forEach((g, i) => {
            _m.compose(g, _q.identity(), _s.setScalar(0.07));
            m.setMatrixAt(i, _m);
          });
          m.instanceMatrix.needsUpdate = true;
        }}
      >
        <meshStandardMaterial color="#ff5a52" emissive="#ff5a52" emissiveIntensity={0.3} />
      </instancedMesh>
      {!goOnly &&
        data.sites.map((s, i) => (
          <mesh key={i} geometry={SPHERE} position={s} scale={0.22}>
            <meshStandardMaterial color="#dfe5ec" metalness={1} roughness={0.22} />
          </mesh>
        ))}
      <instancedMesh ref={flashes} args={[SPHERE, undefined, SITES]}>
        <meshBasicMaterial color="#4fe3c1" transparent opacity={0.18} depthWrite={false} blending={THREE.AdditiveBlending} />
      </instancedMesh>
      <instancedMesh ref={elec} args={[SPHERE, undefined, E]}>
        <meshBasicMaterial color="#8ffff0" toneMapped={false} />
      </instancedMesh>
      {/* current collector */}
      <mesh position={[5.5, sheetY + 0.1, 0]}>
        <boxGeometry args={[0.35, 0.3, 7]} />
        <meshStandardMaterial ref={lead} color="#c89b3c" metalness={1} roughness={0.3} emissive="#4fe3c1" emissiveIntensity={0.1} />
      </mesh>
      {Array.from({ length: A }, (_, a) => (
        <Urea key={a} ref={(el) => { mol.current[a] = el; }} visible={false} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Starch–iodine: amylose helix hosts triiodide                        */
/* ------------------------------------------------------------------ */

function StarchIodine({ progress, positive }: { progress: RefObject<number>; positive: boolean }) {
  const BEADS = 64;
  const I = 9;
  const helix = useRef<THREE.Group>(null!);
  const beads = useRef<THREE.InstancedMesh>(null!);
  const beadMat = useRef<THREE.MeshStandardMaterial>(null!);
  const core = useRef<THREE.MeshBasicMaterial>(null!);
  const iodine = useRef<(THREE.Group | null)[]>([]);
  const [from, to] = COLORS.starch;
  const cFrom = useMemo(() => new THREE.Color(from), [from]);
  const cTo = useMemo(() => new THREE.Color(to), [to]);

  const data = useMemo(() => {
    const r = mulberry32(9);
    const pts = Array.from({ length: BEADS }, (_, i) => {
      const x = -3.4 + (i / (BEADS - 1)) * 6.8;
      const th = x * ((2 * Math.PI) / 0.95);
      return v3().set(x, Math.cos(th) * 0.62, Math.sin(th) * 0.62);
    });
    const curve = new THREE.CatmullRomCurve3(pts);
    const tube = new THREE.TubeGeometry(curve, 400, 0.05, 6, false);
    const start = Array.from({ length: I }, () => v3().set((r() - 0.5) * 8, (r() - 0.5) * 4 + 0.5, (r() - 0.5) * 3 + 1.2));
    const axis = Array.from({ length: I }, (_, i) => v3().set(-2.9 + i * 0.72, 0, 0));
    return { pts, tube, start, axis };
  }, []);
  useEffect(() => () => data.tube.dispose(), [data]);

  useEffect(() => {
    data.pts.forEach((p, i) => {
      _m.compose(p, _q.identity(), _s.setScalar(0.13));
      beads.current.setMatrixAt(i, _m);
    });
    beads.current.instanceMatrix.needsUpdate = true;
  }, [data]);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;
    const enter = positive ? smooth(band(p, 0.0, 0.32)) : 0;
    helix.current.visible = positive;
    helix.current.position.set(THREE.MathUtils.lerp(-10, 0, enter), 0, 0);
    helix.current.rotation.x = t * 0.25;
    const thread = positive ? smooth(band(p, 0.3, 0.7)) : 0;
    const colorK = positive ? smooth(band(p, 0.55, 0.95)) : 0;
    beadMat.current.color.copy(cFrom).lerp(cTo, colorK);
    beadMat.current.emissive.copy(beadMat.current.color);
    core.current.opacity = colorK * 0.35;
    for (let i = 0; i < I; i++) {
      const g = iodine.current[i];
      if (!g) continue;
      const s = data.start[i];
      _p.set(s.x + Math.sin(t * 0.6 + i) * 0.3, s.y + Math.cos(t * 0.5 + i) * 0.3, s.z);
      g.position.copy(_p).lerp(data.axis[i], thread);
      g.rotation.set(0, thread > 0.95 ? 0 : t + i, thread > 0.95 ? 0 : t * 0.7);
    }
  });

  return (
    <group>
      <group ref={helix}>
        <mesh geometry={data.tube}>
          <meshStandardMaterial color="#b89a62" roughness={0.6} />
        </mesh>
        <instancedMesh ref={beads} args={[SPHERE, undefined, BEADS]}>
          <meshStandardMaterial ref={beadMat} color={from} emissive={from} emissiveIntensity={0.15} roughness={0.5} />
        </instancedMesh>
        <mesh rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.4, 0.4, 6.8, 24, 1, true]} />
          <meshBasicMaterial ref={core} color="#3040c0" transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {Array.from({ length: I }, (_, i) => (
        <Triiodide key={i} ref={(el) => { iodine.current[i] = el; }} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Indicator conversion: BTB (detergent) and guaiacol/peroxidase       */
/* ------------------------------------------------------------------ */

function blobGeometry(seed: number) {
  const g = new THREE.IcosahedronGeometry(1, 3);
  const r = mulberry32(seed);
  const pos = g.attributes.position;
  const bumps = Array.from({ length: 6 }, () => randomUnit(r));
  for (let i = 0; i < pos.count; i++) {
    _p.fromBufferAttribute(pos, i);
    const n = _p.clone().normalize();
    let d = 0;
    for (const b of bumps) d += Math.max(0, n.dot(b)) ** 3 * 0.25;
    _p.multiplyScalar(1 + d);
    pos.setXYZ(i, _p.x, _p.y, _p.z);
  }
  g.computeVertexNormals();
  return g;
}

function Conversion({ progress, positive, kind }: { progress: RefObject<number>; positive: boolean; kind: "btb" | "guaiacol" }) {
  const H = kind === "btb" ? 30 : 24;
  const A = kind === "btb" ? 16 : 14;
  const [from, to] = COLORS[kind];
  const cFrom = useMemo(() => new THREE.Color(from), [from]);
  const cTo = useMemo(() => new THREE.Color(to), [to]);
  const hosts = useRef<THREE.InstancedMesh>(null!);
  const actors = useRef<(THREE.Group | null)[]>([]);
  const col = useMemo(() => new THREE.Color(), []);

  const enzymes = useMemo(() => [v3().set(-2.3, 0.4, 0), v3().set(1.2, -0.6, 0.8), v3().set(2.6, 1.2, -1)], []);
  const blobs = useMemo(() => enzymes.map((_, i) => blobGeometry(i + 3)), [enzymes]);
  useEffect(() => () => blobs.forEach((b) => b.dispose()), [blobs]);

  const data = useMemo(() => {
    const r = mulberry32(kind === "btb" ? 17 : 29);
    const fibers = Array.from({ length: 6 }, (_, i) => ({
      pos: v3().set(0, -1.6 + i * 0.7, -1 + (i % 3) * 0.9),
      rot: new THREE.Euler(0, (r() - 0.5) * 1.2, Math.PI / 2 + (r() - 0.5) * 0.5),
    }));
    const hostPos = Array.from({ length: H }, () => v3().set((r() - 0.5) * 8, (r() - 0.5) * 3.8, (r() - 0.5) * 3));
    // guaiacol → groups of four next to an enzyme (tetraguaiacol)
    const groupPos = hostPos.map((_, i) => {
      const e = enzymes[Math.floor(i / 4) % 3];
      const g = Math.floor(i / 4);
      const base = e.clone().add(v3().set(Math.cos(g * 2.1) * 1.5, Math.sin(g * 1.7) * 1.2, Math.sin(g) * 0.8));
      return base.add(v3().set((i % 2) * 0.25, Math.floor((i % 4) / 2) * 0.25, 0));
    });
    const start = Array.from({ length: A }, () => v3().set(-7 - r() * 3, (r() - 0.5) * 4, (r() - 0.5) * 3));
    const dest = Array.from({ length: A }, (_, i) =>
      kind === "guaiacol" ? enzymes[i % 3].clone().add(randomUnit(r).multiplyScalar(1.05)) : v3().set((r() - 0.3) * 7, (r() - 0.5) * 3.5, (r() - 0.5) * 2.5),
    );
    // stagger: indicators nearer the entry side respond first
    const delay = hostPos.map((h) => (h.x + 4) / 8);
    return { fibers, hostPos, groupPos, start, dest, delay };
  }, [H, A, kind, enzymes]);

  useFrame((state) => {
    const p = progress.current ?? 0;
    const t = state.clock.elapsedTime;
    const arrive = smooth(band(p, 0.02, 0.5));
    for (let a = 0; a < A; a++) {
      const g = actors.current[a];
      if (!g) continue;
      g.visible = positive && p > 0.001;
      g.position.copy(data.start[a]).lerp(data.dest[a], arrive);
      g.position.y += Math.sin(t + a) * 0.08;
      g.rotation.set(t * 0.7 + a, t * 0.4, a);
    }
    const gather = kind === "guaiacol" && positive ? smooth(band(p, 0.45, 0.85)) : 0;
    for (let i = 0; i < H; i++) {
      const h = data.hostPos[i];
      _p.set(h.x + Math.sin(t * 0.5 + i) * 0.08, h.y + Math.cos(t * 0.6 + i) * 0.08, h.z).lerp(data.groupPos[i], gather);
      _m.compose(_p, _q.identity(), _s.setScalar(kind === "btb" ? 0.13 : 0.12));
      hosts.current.setMatrixAt(i, _m);
      const k = positive ? smooth(band(p, 0.4 + data.delay[i] * 0.3, 0.6 + data.delay[i] * 0.3)) : 0;
      col.copy(cFrom).lerp(cTo, k);
      hosts.current.setColorAt(i, col);
    }
    hosts.current.instanceMatrix.needsUpdate = true;
    if (hosts.current.instanceColor) hosts.current.instanceColor.needsUpdate = true;
  });

  const Actor = kind === "btb" ? Surfactant : Peroxide;
  return (
    <group>
      {kind === "btb"
        ? data.fibers.map((f, i) => (
            <mesh key={i} position={f.pos} rotation={f.rot}>
              <cylinderGeometry args={[0.14, 0.14, 13, 12]} />
              <meshStandardMaterial color="#e9e1c9" roughness={0.9} transparent opacity={0.55} />
            </mesh>
          ))
        : enzymes.map((e, i) => (
            <mesh key={i} geometry={blobs[i]} position={e} scale={0.75}>
              <meshStandardMaterial color="#7a5ba8" roughness={0.55} emissive="#3a2566" emissiveIntensity={0.4} />
            </mesh>
          ))}
      <instancedMesh ref={hosts} args={[SPHERE, undefined, H]}>
        <meshStandardMaterial color="#ffffff" roughness={0.35} emissive="#222" emissiveIntensity={0.2} />
      </instancedMesh>
      {Array.from({ length: A }, (_, a) => (
        <Actor key={a} ref={(el) => { actors.current[a] = el; }} visible={false} />
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Wrapper                                                             */
/* ------------------------------------------------------------------ */

function Dust() {
  const ref = useRef<THREE.Points>(null!);
  const geo = useMemo(() => {
    const r = mulberry32(1);
    const n = 260;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      arr[i * 3] = (r() - 0.5) * 22;
      arr[i * 3 + 1] = (r() - 0.5) * 12;
      arr[i * 3 + 2] = (r() - 0.5) * 12 - 3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.01;
  });
  return (
    <points ref={ref} geometry={geo}>
      <pointsMaterial size={0.035} color="#7fd8c8" transparent opacity={0.45} depthWrite={false} />
    </points>
  );
}

export function NanoWorld({ mode, progress, positive = true, goOnly = false, spin = true }: NanoWorldProps) {
  const g = useRef<THREE.Group>(null!);
  useFrame((state, dt) => {
    if (spin) g.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.12) * 0.35;
    void dt;
  });
  return (
    <group>
      <Dust />
      <group ref={g}>
        {mode === "agnp" && <Aggregation progress={progress} positive={positive} metal="ag" />}
        {mode === "dithizone" && <Aggregation progress={progress} positive={positive} metal="au" />}
        {mode === "aggo" && <Electrode progress={progress} positive={positive} goOnly={goOnly} />}
        {mode === "starch" && <StarchIodine progress={progress} positive={positive} />}
        {mode === "btb" && <Conversion progress={progress} positive={positive} kind="btb" />}
        {mode === "guaiacol" && <Conversion progress={progress} positive={positive} kind="guaiacol" />}
      </group>
    </group>
  );
}

/** Lights tuned for the nanoscale scenes. */
export function NanoLights() {
  return (
    <>
      <ambientLight intensity={0.35} />
      <directionalLight position={[3, 5, 4]} intensity={1.4} />
      <pointLight position={[-4, 2, 3]} intensity={18} color="#4fe3c1" distance={14} />
      <pointLight position={[5, -2, 2]} intensity={12} color="#6aa8ff" distance={14} />
    </>
  );
}

/**
 * Animates a progress ref from 0→1 over `duration` seconds whenever
 * `playKey` changes. Calls `onProgress` at ~10 Hz for DOM overlays.
 */
export function Timeline({
  progress,
  playKey,
  duration = 7,
  loop = false,
  onProgress,
}: {
  progress: RefObject<number>;
  playKey: number;
  duration?: number;
  loop?: boolean;
  onProgress?: (p: number) => void;
}) {
  const start = useRef<number | null>(null);
  const last = useRef(0);
  const prevKey = useRef(playKey);
  useFrame((state) => {
    const now = state.clock.elapsedTime;
    if (playKey === 0) {
      progress.current = 0;
      start.current = null;
      prevKey.current = 0;
      return;
    }
    if (prevKey.current !== playKey) {
      prevKey.current = playKey;
      start.current = now;
    }
    if (start.current === null) start.current = now;
    let p = (now - start.current) / duration;
    if (loop) p = p % 1.15;
    progress.current = Math.min(1, p);
    if (onProgress && now - last.current > 0.1) {
      last.current = now;
      onProgress(progress.current);
    }
  });
  return null;
}
