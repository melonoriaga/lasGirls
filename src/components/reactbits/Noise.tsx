"use client";

/**
 * React Bits official `Noise` (canvas grain), vendored from:
 * https://github.com/appletosolutions/reactbits/blob/master/src/Noise.tsx (MIT).
 * The published npm bundle imports optional peers (Chakra, R3F, etc.); this file is the real component source.
 */
import { useRef, useEffect, type FC } from "react";

export interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

export const Noise: FC<NoiseProps> = ({
  patternSize = 250,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 15,
}) => {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const grainRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = grainRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let rafId = 0;

    const patternCanvas = document.createElement("canvas");
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext("2d");
    if (!patternCtx) return;

    const patternData = patternCtx.createImageData(patternSize, patternSize);
    const patternPixelDataLength = patternSize * patternSize * 4;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr * patternScaleX, 0, 0, dpr * patternScaleY, 0, 0);
    };

    const updatePattern = () => {
      for (let i = 0; i < patternPixelDataLength; i += 4) {
        const value = Math.random() * 255;
        patternData.data[i] = value;
        patternData.data[i + 1] = value;
        patternData.data[i + 2] = value;
        patternData.data[i + 3] = patternAlpha;
      }
      patternCtx.putImageData(patternData, 0, 0);
    };

    const drawGrain = () => {
      const rect = wrap.getBoundingClientRect();
      const w = Math.max(1, rect.width);
      const h = Math.max(1, rect.height);
      ctx.clearRect(0, 0, w / patternScaleX + 1, h / patternScaleY + 1);
      const pattern = ctx.createPattern(patternCanvas, "repeat");
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, w / patternScaleX + 1, h / patternScaleY + 1);
      }
    };

    const loop = () => {
      if (frame % patternRefreshInterval === 0) {
        updatePattern();
        drawGrain();
      }
      frame += 1;
      rafId = window.requestAnimationFrame(loop);
    };

    resize();
    updatePattern();
    drawGrain();
    rafId = window.requestAnimationFrame(loop);

    const ro =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => {
            resize();
            updatePattern();
            drawGrain();
          })
        : null;
    ro?.observe(wrap);

    return () => {
      window.cancelAnimationFrame(rafId);
      ro?.disconnect();
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <div ref={wrapRef} className="absolute inset-0 overflow-hidden">
      <canvas ref={grainRef} className="pointer-events-none block h-full w-full" aria-hidden />
    </div>
  );
};
