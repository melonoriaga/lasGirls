"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const DISPLAY = 400; // display canvas size (px)
const PREVIEW = 180; // preview square size (px)
const MIN_CROP = 60; // minimum crop size (px in display coords)
const MAX_OUTPUT = 800; // output canvas resolution
const MAX_BYTES = 1024 * 1024; // 1 MB

type Point = { x: number; y: number };
type Crop = { x: number; y: number; size: number };

type CropUploadModalProps = {
  file: File;
  onConfirm: (blob: Blob, originalName: string) => void;
  onCancel: () => void;
};

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** Renders image + draggable square crop on a canvas, returns cropped Blob at 1:1. */
export function CropUploadModal({ file, onConfirm, onCancel }: CropUploadModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  // Crop state in display-canvas coords
  const [crop, setCrop] = useState<Crop>({ x: 0, y: 0, size: DISPLAY * 0.7 });
  const [loaded, setLoaded] = useState(false);

  // Drag state (refs to avoid stale closures in event listeners)
  const dragRef = useRef<{ type: "move" | "resize"; start: Point; cropAtStart: Crop } | null>(null);

  // ── Load image ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      imgRef.current = img;
      // Center the initial crop square
      const initial = Math.min(DISPLAY, DISPLAY) * 0.72;
      setCrop({
        x: (DISPLAY - initial) / 2,
        y: (DISPLAY - initial) / 2,
        size: initial,
      });
      setLoaded(true);
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // ── Draw main canvas ─────────────────────────────────────────────────────────
  const draw = useCallback((c: Crop) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext("2d")!;

    // Letterbox image into DISPLAY x DISPLAY
    const scale = Math.min(DISPLAY / img.naturalWidth, DISPLAY / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offX = (DISPLAY - drawW) / 2;
    const offY = (DISPLAY - drawH) / 2;

    ctx.clearRect(0, 0, DISPLAY, DISPLAY);
    ctx.drawImage(img, offX, offY, drawW, drawH);

    // Dark overlay outside crop
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    ctx.fillRect(0, 0, DISPLAY, DISPLAY);
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,1)";
    ctx.fillRect(c.x, c.y, c.size, c.size);
    ctx.restore();

    // Redraw image inside crop (sharp)
    ctx.save();
    ctx.beginPath();
    ctx.rect(c.x, c.y, c.size, c.size);
    ctx.clip();
    ctx.drawImage(img, offX, offY, drawW, drawH);
    ctx.restore();

    // Border + corner handles
    ctx.strokeStyle = "#ff3ea5";
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x, c.y, c.size, c.size);

    const h = 12;
    ctx.fillStyle = "#ff3ea5";
    const corners = [
      [c.x, c.y],
      [c.x + c.size - h, c.y],
      [c.x, c.y + c.size - h],
      [c.x + c.size - h, c.y + c.size - h],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillRect(cx!, cy!, h, h);
    }

    // Grid thirds
    ctx.strokeStyle = "rgba(255,255,255,0.22)";
    ctx.lineWidth = 1;
    for (let n = 1; n <= 2; n++) {
      ctx.beginPath();
      ctx.moveTo(c.x + (c.size / 3) * n, c.y);
      ctx.lineTo(c.x + (c.size / 3) * n, c.y + c.size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(c.x, c.y + (c.size / 3) * n);
      ctx.lineTo(c.x + c.size, c.y + (c.size / 3) * n);
      ctx.stroke();
    }
  }, []);

  // ── Draw preview ─────────────────────────────────────────────────────────────
  const drawPreview = useCallback((c: Crop) => {
    const pCanvas = previewRef.current;
    const canvas = canvasRef.current;
    if (!pCanvas || !canvas) return;
    const pCtx = pCanvas.getContext("2d")!;
    pCtx.clearRect(0, 0, PREVIEW, PREVIEW);
    pCtx.drawImage(canvas, c.x, c.y, c.size, c.size, 0, 0, PREVIEW, PREVIEW);
  }, []);

  // Redraw when crop changes
  useEffect(() => {
    if (!loaded) return;
    draw(crop);
    drawPreview(crop);
  }, [crop, loaded, draw, drawPreview]);

  // ── Hit test ─────────────────────────────────────────────────────────────────
  function hitTest(pos: Point, c: Crop): "move" | "resize" | null {
    const h = 20; // handle tolerance
    const inHandle =
      pos.x >= c.x + c.size - h &&
      pos.x <= c.x + c.size + h &&
      pos.y >= c.y + c.size - h &&
      pos.y <= c.y + c.size + h;
    if (inHandle) return "resize";
    if (pos.x >= c.x && pos.x <= c.x + c.size && pos.y >= c.y && pos.y <= c.y + c.size) return "move";
    return null;
  }

  function canvasPos(e: React.MouseEvent | MouseEvent): Point {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  const onMouseDown = (e: React.MouseEvent) => {
    const pos = canvasPos(e);
    const hit = hitTest(pos, crop);
    if (!hit) return;
    e.preventDefault();
    dragRef.current = { type: hit, start: pos, cropAtStart: { ...crop } };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const pos = canvasPos(e);
      const dx = pos.x - dragRef.current.start.x;
      const dy = pos.y - dragRef.current.start.y;
      const base = dragRef.current.cropAtStart;

      if (dragRef.current.type === "move") {
        const newX = clamp(base.x + dx, 0, DISPLAY - base.size);
        const newY = clamp(base.y + dy, 0, DISPLAY - base.size);
        setCrop({ x: newX, y: newY, size: base.size });
      } else {
        const delta = Math.max(dx, dy);
        const newSize = clamp(base.size + delta, MIN_CROP, Math.min(DISPLAY - base.x, DISPLAY - base.y));
        setCrop({ x: base.x, y: base.y, size: newSize });
      }
    };
    const onUp = () => { dragRef.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  // ── Cursor ───────────────────────────────────────────────────────────────────
  const [cursor, setCursor] = useState("default");
  const onMouseMove = (e: React.MouseEvent) => {
    const pos = canvasPos(e);
    const hit = hitTest(pos, crop);
    setCursor(hit === "resize" ? "nwse-resize" : hit === "move" ? "grab" : "default");
  };

  // ── Confirm: crop → canvas → blob (compress if > 1MB) ─────────────────────
  const handleConfirm = useCallback(async () => {
    const img = imgRef.current;
    const displayCanvas = canvasRef.current;
    if (!img || !displayCanvas) return;

    const scale = Math.min(DISPLAY / img.naturalWidth, DISPLAY / img.naturalHeight);
    const drawW = img.naturalWidth * scale;
    const drawH = img.naturalHeight * scale;
    const offX = (DISPLAY - drawW) / 2;
    const offY = (DISPLAY - drawH) / 2;

    // Map display crop coords → natural image coords
    const natX = (crop.x - offX) / scale;
    const natY = (crop.y - offY) / scale;
    const natSize = crop.size / scale;

    const out = document.createElement("canvas");
    out.width = MAX_OUTPUT;
    out.height = MAX_OUTPUT;
    const ctx = out.getContext("2d")!;
    ctx.drawImage(img, natX, natY, natSize, natSize, 0, 0, MAX_OUTPUT, MAX_OUTPUT);

    // Compress until ≤ 1MB
    let quality = 0.92;
    let blob: Blob | null = null;
    while (quality >= 0.5) {
      blob = await new Promise<Blob | null>((res) => out.toBlob(res, "image/png", quality));
      if (!blob || blob.size <= MAX_BYTES) break;
      quality -= 0.08;
      // Try jpeg for smaller sizes
      blob = await new Promise<Blob | null>((res) => out.toBlob(res, "image/jpeg", quality));
      if (!blob || blob.size <= MAX_BYTES) break;
      quality -= 0.08;
    }

    if (!blob) return;
    if (blob.size > MAX_BYTES) {
      // Force smaller canvas
      const small = document.createElement("canvas");
      small.width = 600;
      small.height = 600;
      small.getContext("2d")!.drawImage(out, 0, 0, 600, 600);
      blob = await new Promise<Blob | null>((res) => small.toBlob(res, "image/jpeg", 0.82));
    }
    if (!blob) return;
    onConfirm(blob, file.name);
  }, [crop, file.name, onConfirm]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div>
            <p className="text-sm font-bold text-zinc-900">Recortar logo</p>
            <p className="mt-0.5 text-xs text-zinc-500">Arrastrá la selección · esquina inferior-derecha para redimensionar</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Cancelar"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col items-center gap-6 p-6 sm:flex-row sm:items-start sm:gap-8">
          {/* Main canvas */}
          <div className="shrink-0">
            {!loaded && (
              <div
                className="flex items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-500"
                style={{ width: DISPLAY, height: DISPLAY }}
              >
                Cargando…
              </div>
            )}
            <canvas
              ref={canvasRef}
              width={DISPLAY}
              height={DISPLAY}
              style={{ cursor, display: loaded ? "block" : "none", borderRadius: 12 }}
              className="border border-zinc-200 shadow-sm"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
            />
          </div>

          {/* Preview + info */}
          <div className="flex flex-col items-center gap-4">
            <div className="space-y-1 text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">Vista previa 1 : 1</p>
              <canvas
                ref={previewRef}
                width={PREVIEW}
                height={PREVIEW}
                className="rounded-xl border border-zinc-200 bg-zinc-50 shadow-sm"
              />
              <p className="text-[10px] text-zinc-400">Como se verá en el carrusel</p>
            </div>

            <div className="w-full rounded-xl border border-zinc-100 bg-zinc-50 p-3 text-xs text-zinc-600 space-y-1">
              <p><span className="font-semibold">Formato:</span> PNG / JPEG</p>
              <p><span className="font-semibold">Máximo:</span> 1 MB</p>
              <p><span className="font-semibold">Salida:</span> {MAX_OUTPUT} × {MAX_OUTPUT} px</p>
              <p className="text-zinc-400 text-[10px] mt-1">Se comprime automáticamente si supera 1MB</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 border-t border-zinc-100 px-6 py-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!loaded}
            onClick={() => void handleConfirm()}
            className="rounded-xl bg-[#ff3ea5] px-6 py-2.5 text-sm font-bold text-white shadow-[0_6px_20px_-6px_rgba(255,62,165,0.5)] transition hover:brightness-110 disabled:opacity-50"
          >
            Subir logo
          </button>
        </div>
      </div>
    </div>
  );
}
