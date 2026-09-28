"use client";
import { useEffect, useRef, useState } from "react";
import { Camera, ImageUp, RotateCcw, X } from "lucide-react";
import { extract, fileToDataUrl, imageData, videoFrameToDataUrl, type Roi } from "./image";
import { useNS, useWorkspace } from "./store";
import type { SampleKind } from "@/content/nanosense";

/* ------------------------------------------------------------------ */
/* Photo input: upload or live camera capture                          */
/* ------------------------------------------------------------------ */

export function PhotoInput({ hasPhoto, onPhoto }: { hasPhoto: boolean; onPhoto: (dataUrl: string, source: "upload" | "camera") => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);
  const [camera, setCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const read = async (file: File | undefined, source: "upload" | "camera") => {
    if (!file) return;
    setError(null);
    try {
      onPhoto(await fileToDataUrl(file), source);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openCamera = () => {
    if (typeof navigator.mediaDevices?.getUserMedia === "function") setCamera(true);
    else mobileRef.current?.click();
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-full bg-ns-blue px-4 py-2 text-sm font-medium text-white hover:brightness-110"
        >
          <ImageUp className="h-4 w-4" /> {hasPhoto ? "Replace photograph" : "Upload photograph"}
        </button>
        <button
          type="button"
          onClick={openCamera}
          className="inline-flex items-center gap-2 rounded-full border border-ns-line2 bg-ns-surface px-4 py-2 text-sm font-medium hover:border-ns-blue/50 hover:text-ns-blue"
        >
          {hasPhoto ? <RotateCcw className="h-4 w-4" /> : <Camera className="h-4 w-4" />} {hasPhoto ? "Re-capture" : "Capture with camera"}
        </button>
      </div>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => (read(e.target.files?.[0], "upload"), (e.target.value = ""))} />
      <input
        ref={mobileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => (read(e.target.files?.[0], "camera"), (e.target.value = ""))}
      />
      {error && <p className="mt-2 text-[12px] text-ns-amber">{error}</p>}
      {camera && (
        <CameraModal
          onClose={() => setCamera(false)}
          onCapture={(url) => {
            setCamera(false);
            onPhoto(url, "camera");
          }}
          onFallback={() => {
            setCamera(false);
            mobileRef.current?.click();
          }}
        />
      )}
    </div>
  );
}

function CameraModal({ onClose, onCapture, onFallback }: { onClose: () => void; onCapture: (url: string) => void; onFallback: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 } }, audio: false })
      .then((s) => {
        stream = s;
        if (video.current) video.current.srcObject = s;
      })
      .catch(() => setErr("Camera not available or permission denied."));
    return () => stream?.getTracks().forEach((t) => t.stop());
  }, []);

  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-label="Capture photograph">
      <div className="ns-card w-full max-w-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-ns-line px-4 py-3">
          <span className="text-sm font-semibold">Capture the physical test</span>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-ns-surface2" aria-label="Close camera">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-black">
          {err ? (
            <div className="grid h-64 place-items-center p-6 text-center text-sm text-white/80">
              <div>
                {err}
                <button type="button" onClick={onFallback} className="mt-3 block w-full text-ns-blue underline">
                  Use the device camera / file picker instead
                </button>
              </div>
            </div>
          ) : (
            <video ref={video} autoPlay playsInline muted className="max-h-[60vh] w-full" />
          )}
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-[12px] text-ns-muted">
          <span>Tip: fixed light, plain white background, same distance for every sample.</span>
          <button
            type="button"
            disabled={!!err}
            onClick={() => video.current && video.current.videoWidth && onCapture(videoFrameToDataUrl(video.current))}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-ns-blue px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
          >
            <Camera className="h-4 w-4" /> Capture
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ROI extraction (real pixel maths on the stored photo)               */
/* ------------------------------------------------------------------ */

const cache = new Map<string, Promise<ImageData>>();
function pixels(src: string) {
  let p = cache.get(src);
  if (!p) {
    p = imageData(src);
    cache.set(src, p);
    if (cache.size > 6) cache.delete(cache.keys().next().value as string);
  }
  return p;
}

/** Re-extracts ROI colours whenever the photo or a region changes. */
export function useRoiExtraction(kind: SampleKind) {
  const ws = useWorkspace();
  const updateSample = useNS((s) => s.updateSample);
  const { photo, roi, whiteRoi } = ws.samples[kind];
  useEffect(() => {
    if (!photo) return;
    let live = true;
    pixels(photo).then((d) => {
      if (!live) return;
      updateSample(kind, { sampleRgb: roi ? extract(d, roi) : null, whiteRgb: whiteRoi ? extract(d, whiteRoi) : null });
    });
    return () => {
      live = false;
    };
  }, [photo, roi, whiteRoi, kind, updateSample]);
}

/* ------------------------------------------------------------------ */
/* ROI editor                                                          */
/* ------------------------------------------------------------------ */

export type RoiTool = "sample" | "white";

export function RoiEditor({
  photo,
  roi,
  whiteRoi,
  tool,
  onChange,
  alt,
}: {
  photo: string;
  roi: Roi | null;
  whiteRoi: Roi | null;
  tool: RoiTool;
  onChange: (p: { roi?: Roi; whiteRoi?: Roi }) => void;
  alt: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [draft, setDraft] = useState<Roi | null>(null);

  const pos = (e: React.PointerEvent) => {
    const r = box.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };
  const rect = (a: { x: number; y: number }, b: { x: number; y: number }): Roi => ({
    x: Math.min(a.x, b.x),
    y: Math.min(a.y, b.y),
    w: Math.abs(a.x - b.x),
    h: Math.abs(a.y - b.y),
  });

  return (
    <div
      ref={box}
      className="relative cursor-crosshair touch-none overflow-hidden rounded-xl border border-ns-line2 bg-black select-none"
      onPointerDown={(e) => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          // Not every pointer can be captured (e.g. synthetic events); dragging still works inside the photo.
        }
        start.current = pos(e);
        setDraft(null);
      }}
      onPointerMove={(e) => start.current && setDraft(rect(start.current, pos(e)))}
      onPointerUp={(e) => {
        if (start.current) {
          const r = rect(start.current, pos(e));
          if (r.w > 0.01 && r.h > 0.01) onChange(tool === "sample" ? { roi: r } : { whiteRoi: r });
        }
        start.current = null;
        setDraft(null);
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt={alt} className="block w-full" draggable={false} />
      {/* dim everything outside the sample ROI: the background is ignored */}
      {roi && (
        <div
          className="pointer-events-none absolute border-2 border-ns-s3 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
          style={{ left: `${roi.x * 100}%`, top: `${roi.y * 100}%`, width: `${roi.w * 100}%`, height: `${roi.h * 100}%` }}
        >
          <span className="mono absolute -top-5 left-0 rounded bg-ns-s3 px-1 text-[9.5px] font-bold text-white">ROI</span>
        </div>
      )}
      {whiteRoi && (
        <div
          className="pointer-events-none absolute border-2 border-dashed border-white"
          style={{ left: `${whiteRoi.x * 100}%`, top: `${whiteRoi.y * 100}%`, width: `${whiteRoi.w * 100}%`, height: `${whiteRoi.h * 100}%` }}
        >
          <span className="mono absolute -top-5 left-0 rounded bg-white px-1 text-[9.5px] font-bold text-black">WHITE REF</span>
        </div>
      )}
      {draft && (
        <div
          className={`pointer-events-none absolute border-2 ${tool === "sample" ? "border-ns-s3 bg-ns-s3/15" : "border-dashed border-white bg-white/15"}`}
          style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.w * 100}%`, height: `${draft.h * 100}%` }}
        />
      )}
    </div>
  );
}

/** Enlarged crop of a region, drawn from the photo. */
export function RoiCrop({ photo, roi, label }: { photo: string; roi: Roi | null; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv || !roi) return;
    const img = new Image();
    img.onload = () => {
      const ctx = cv.getContext("2d");
      if (!ctx) return;
      const sw = roi.w * img.naturalWidth;
      const sh = roi.h * img.naturalHeight;
      const s = Math.min(cv.width / sw, cv.height / sh);
      ctx.clearRect(0, 0, cv.width, cv.height);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, roi.x * img.naturalWidth, roi.y * img.naturalHeight, sw, sh, (cv.width - sw * s) / 2, (cv.height - sh * s) / 2, sw * s, sh * s);
    };
    img.src = photo;
  }, [photo, roi]);
  return (
    <figure className="text-center">
      <div className="grid h-28 place-items-center rounded-lg border border-ns-line bg-ns-surface2">
        {roi ? <canvas ref={ref} width={160} height={104} className="max-h-full" /> : <span className="text-[11px] text-ns-muted">not selected</span>}
      </div>
      <figcaption className="mono mt-1 text-[10px] tracking-wider text-ns-muted uppercase">{label}</figcaption>
    </figure>
  );
}
