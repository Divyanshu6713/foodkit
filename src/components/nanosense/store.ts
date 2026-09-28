"use client";
import { useMemo } from "react";
import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import { ASSAY, CONTROL_RUNS, DEFAULT_IDS, DEMO, OBSERVATIONS, type Channel, type SampleKind } from "@/content/nanosense";
import { makeSyntheticPhoto, opticalFeature, rgbHex, type Extraction, type Roi } from "./image";
import { analyseCalibration, estimate, type CalRow } from "./model";

/**
 * Two workspaces that are never mixed:
 *   real — the team's own laboratory inputs (persisted in this browser)
 *   demo — illustrative data for SIMULATION mode (regenerated on demand)
 */
export type Mode = "real" | "demo";

export interface SampleRecord {
  id: string;
  observation: string;
  controlRun: string;
  photo: string | null;
  photoSource: "upload" | "camera" | "synthetic" | null;
  capturedAt: string | null;
  roi: Roi | null;
  whiteRoi: Roi | null;
  sampleRgb: Extraction | null;
  whiteRgb: Extraction | null;
}

export interface CalibrationState {
  status: "none" | "experimental" | "illustrative";
  unit: string;
  rows: CalRow[];
  fileName: string | null;
  updatedAt: string | null;
}

export interface Workspace {
  foodType: string;
  target: string;
  physicalDone: boolean;
  active: SampleKind;
  channel: Channel;
  samples: Record<SampleKind, SampleRecord>;
  calibration: CalibrationState;
}

type WsFields = Pick<Workspace, "foodType" | "target" | "physicalDone" | "active" | "channel">;

interface NSState {
  theme: "light" | "dark";
  mode: Mode;
  real: Workspace;
  demo: Workspace | null;
  notice: string | null;
  setTheme: (t: "light" | "dark") => void;
  setMode: (m: Mode, notice?: string) => void;
  set: (p: Partial<WsFields>) => void;
  updateSample: (k: SampleKind, p: Partial<SampleRecord>) => void;
  setCalibrationRows: (rows: CalRow[], meta?: { fileName?: string | null; unit?: string }) => void;
  setUnit: (unit: string) => void;
  importExperimental: (rows: CalRow[], fileName: string) => void;
  loadDemo: () => void;
  resetWorkspace: () => void;
  ensureDemo: () => void;
  dismissNotice: () => void;
}

const emptySample = (k: SampleKind): SampleRecord => ({
  id: DEFAULT_IDS[k],
  observation: "",
  controlRun: CONTROL_RUNS[0],
  photo: null,
  photoSource: null,
  capturedAt: null,
  roi: null,
  whiteRoi: null,
  sampleRgb: null,
  whiteRgb: null,
});

const emptyCalibration = (): CalibrationState => ({ status: "none", unit: "", rows: [], fileName: null, updatedAt: null });

const emptyWorkspace = (): Workspace => ({
  foodType: ASSAY.sampleType,
  target: ASSAY.target,
  physicalDone: false,
  active: "unknown",
  channel: ASSAY.featureChannel,
  samples: { control: emptySample("control"), reference: emptySample("reference"), unknown: emptySample("unknown") },
  calibration: emptyCalibration(),
});

function gaussian(seed: number) {
  let s = seed;
  const u = () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
  return () => Math.sqrt(-2 * Math.log(u() || 1e-9)) * Math.cos(2 * Math.PI * u());
}

/** Illustrative calibration rows: F = f0 + k·c + noise. NOT experimental. */
export function illustrativeRows(): CalRow[] {
  const g = gaussian(20260928);
  const rows: CalRow[] = [];
  DEMO.levels.forEach((c) => {
    for (let r = 1; r <= DEMO.replicates; r++) {
      rows.push({
        sampleId: `STD-${String(c).padStart(2, "0")}`,
        conc: String(c),
        feature: (DEMO.f0 + DEMO.k * c + g() * DEMO.noise).toFixed(4),
        replicate: String(r),
        notes: "Illustrative — not measured",
        origin: "illustrative",
      });
    }
  });
  return rows;
}

/** Builds the SIMULATION workspace (needs a browser: it draws synthetic photos). */
function buildDemo(): Workspace {
  const ws = emptyWorkspace();
  ws.physicalDone = true;
  (["control", "reference", "unknown"] as SampleKind[]).forEach((k, i) => {
    const syn = makeSyntheticPhoto(DEMO.conc[k], 101 + i);
    ws.samples[k] = {
      ...ws.samples[k],
      observation: k === "control" ? OBSERVATIONS[2] : OBSERVATIONS[0],
      photo: syn.photo,
      photoSource: "synthetic",
      capturedAt: new Date().toISOString(),
      roi: syn.roi,
      whiteRoi: syn.whiteRoi,
      sampleRgb: syn.sampleRgb,
      whiteRgb: syn.whiteRgb,
    };
  });
  ws.calibration = { status: "illustrative", unit: DEMO.unit, rows: illustrativeRows(), fileName: null, updatedAt: new Date().toISOString() };
  return ws;
}

const safeStorage: StateStorage = {
  getItem: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  setItem: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      // Quota exceeded (large photos) or storage blocked: keep working in memory.
    }
  },
  removeItem: (k) => {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

export const useNS = create<NSState>()(
  persist(
    (set, get) => {
      /** Applies a change to the workspace of the current mode only. */
      const patch = (fn: (w: Workspace) => Workspace) =>
        set((s) => (s.mode === "demo" ? (s.demo ? { demo: fn(s.demo) } : {}) : { real: fn(s.real) }));
      return {
        theme: "light",
        mode: "real",
        real: emptyWorkspace(),
        demo: null,
        notice: null,
        setTheme: (theme) => set({ theme }),
        setMode: (mode, notice) => {
          if (mode === "demo" && !get().demo) set({ demo: buildDemo() });
          set({ mode, notice: notice ?? null });
        },
        set: (p) => patch((w) => ({ ...w, ...p })),
        updateSample: (k, p) => patch((w) => ({ ...w, samples: { ...w.samples, [k]: { ...w.samples[k], ...p } } })),
        setCalibrationRows: (rows, meta) =>
          patch((w) => ({
            ...w,
            calibration: {
              ...w.calibration,
              rows,
              // The source follows the workspace: real data is experimental, demo data is illustrative.
              status: rows.length === 0 ? "none" : get().mode === "demo" ? "illustrative" : "experimental",
              fileName: meta?.fileName !== undefined ? meta.fileName : w.calibration.fileName,
              unit: meta?.unit ?? w.calibration.unit,
              updatedAt: new Date().toISOString(),
            },
          })),
        setUnit: (unit) => patch((w) => ({ ...w, calibration: { ...w.calibration, unit } })),
        importExperimental: (rows, fileName) =>
          set((s) => ({
            mode: "real",
            notice: s.mode === "demo" ? "Switched to Real Experiment mode: uploaded data is experimental and is kept separate from the simulation." : null,
            real: {
              ...s.real,
              calibration: { ...s.real.calibration, rows, status: rows.length ? "experimental" : "none", fileName, updatedAt: new Date().toISOString() },
            },
          })),
        loadDemo: () =>
          set({
            demo: buildDemo(),
            mode: "demo",
            notice: "Switched to Simulation mode: the illustrative dataset is kept separate from your experimental data, which is unchanged.",
          }),
        resetWorkspace: () => (get().mode === "demo" ? set({ demo: buildDemo() }) : set({ real: emptyWorkspace() })),
        ensureDemo: () => {
          if (get().mode === "demo" && !get().demo) set({ demo: buildDemo() });
        },
        dismissNotice: () => set({ notice: null }),
      };
    },
    {
      name: "nanosense-v2",
      storage: createJSONStorage(() => safeStorage),
      skipHydration: true,
      // Only the real workspace is stored; the simulation is regenerated.
      partialize: ({ theme, mode, real }) => ({ theme, mode, real }),
    },
  ),
);

export function useWorkspace(): Workspace {
  const mode = useNS((s) => s.mode);
  const real = useNS((s) => s.real);
  const demo = useNS((s) => s.demo);
  return mode === "demo" && demo ? demo : real;
}

/**
 * Result state of a sample:
 *   none — no physical test recorded
 *   A    — physical test only (qualitative)
 *   B    — + image analysis: optical feature extracted
 *   C    — + valid calibration model: estimated concentration
 */
export type ResultState = "none" | "A" | "B" | "C";

/** Everything the pages show, derived from the current workspace in one place. */
export function useDerived() {
  const ws = useWorkspace();
  const mode = useNS((s) => s.mode);
  return useMemo(() => {
    const cal = analyseCalibration(ws.calibration.rows);
    const calibrated = cal.fit.ok && ws.calibration.status !== "none";
    const per = (k: SampleKind) => {
      const s = ws.samples[k];
      const feature = opticalFeature(s.sampleRgb, s.whiteRgb, ws.channel);
      const physical = ws.physicalDone && s.observation.trim() !== "";
      const est = calibrated && feature !== null ? estimate(cal.fit, feature) : null;
      const state: ResultState = !physical ? "none" : feature === null ? "A" : !est ? "B" : "C";
      return {
        kind: k,
        ...s,
        physical,
        feature,
        colour: s.sampleRgb ? rgbHex(s.sampleRgb.rgb) : null,
        estimate: est,
        state,
      };
    };
    const all = { control: per("control"), reference: per("reference"), unknown: per("unknown") };
    return {
      mode,
      isDemo: mode === "demo",
      ws,
      cal,
      calibrated,
      unit: ws.calibration.unit || (mode === "demo" ? DEMO.unit : "units"),
      calibration: ws.calibration,
      all,
      current: all[ws.active],
    };
  }, [ws, mode]);
}

export type SampleView = ReturnType<typeof useDerived>["current"];
