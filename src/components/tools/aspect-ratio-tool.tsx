"use client";

import { useState, useCallback } from "react";
import { motion } from "motion/react";
import { Copy, Check } from "lucide-react";
import { ToolLayout, TOOL_THEME } from "@/components/tools/tool-layout";

const { BEIGE, INK, PINK } = TOOL_THEME;

interface Format {
  platform: string;
  label: string;
  w: number;
  h: number;
  note?: string;
}

const FORMATS: Format[] = [
  { platform: "Instagram", label: "Feed cuadrado", w: 1080, h: 1080 },
  { platform: "Instagram", label: "Feed horizontal", w: 1080, h: 566, note: "1.91:1" },
  { platform: "Instagram", label: "Feed retrato", w: 1080, h: 1350, note: "4:5 — recomendado" },
  { platform: "Instagram", label: "Stories & Reels", w: 1080, h: 1920, note: "9:16" },
  { platform: "Instagram", label: "Story zona segura", w: 1080, h: 1920, note: "área útil: 1080×1420" },
  { platform: "TikTok", label: "Video vertical", w: 1080, h: 1920, note: "9:16" },
  { platform: "TikTok", label: "Feed cuadrado", w: 1080, h: 1080 },
  { platform: "YouTube", label: "Thumbnail HD", w: 1280, h: 720, note: "16:9 mínimo" },
  { platform: "YouTube", label: "Thumbnail Full", w: 1920, h: 1080 },
  { platform: "YouTube", label: "Shorts", w: 1080, h: 1920, note: "9:16" },
  { platform: "YouTube", label: "Banner canal", w: 2560, h: 1440, note: "safe: 1546×423" },
  { platform: "X / Twitter", label: "Post imagen", w: 1200, h: 675, note: "16:9" },
  { platform: "X / Twitter", label: "Header", w: 1500, h: 500, note: "3:1" },
  { platform: "X / Twitter", label: "Avatar", w: 400, h: 400 },
  { platform: "LinkedIn", label: "Post imagen", w: 1200, h: 628, note: "1.91:1" },
  { platform: "LinkedIn", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "LinkedIn", label: "Banner perfil", w: 1584, h: 396, note: "4:1" },
  { platform: "LinkedIn", label: "Logo empresa", w: 300, h: 300 },
  { platform: "Facebook", label: "Post imagen", w: 1200, h: 630 },
  { platform: "Facebook", label: "Stories", w: 1080, h: 1920, note: "9:16" },
  { platform: "Facebook", label: "Cover", w: 820, h: 312 },
  { platform: "Pinterest", label: "Pin estándar", w: 1000, h: 1500, note: "2:3 — recomendado" },
  { platform: "Pinterest", label: "Pin cuadrado", w: 1000, h: 1000 },
  { platform: "Web", label: "Banner leaderboard", w: 728, h: 90 },
  { platform: "Web", label: "Banner medium rect", w: 300, h: 250 },
  { platform: "Web", label: "Hero 16:9", w: 1920, h: 1080 },
  { platform: "Web", label: "Open Graph", w: 1200, h: 630, note: "meta social preview" },
];

const PLATFORMS = [...new Set(FORMATS.map((f) => f.platform))];

const PLATFORM_COLORS: Record<string, string> = {
  Instagram: "#E1306C",
  TikTok: "#111",
  YouTube: "#FF0000",
  "X / Twitter": "#1DA1F2",
  LinkedIn: "#0077B5",
  Facebook: "#1877F2",
  Pinterest: "#BD081C",
  Web: "#111",
};

function FormatCard({ fmt }: { fmt: Format }) {
  const [copied, setCopied] = useState(false);
  const ratio = fmt.w / fmt.h;
  const label = `${fmt.w}×${fmt.h}`;

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(label).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [label]);

  const previewW = 80;
  const previewH = Math.round(previewW / ratio);
  const clampedH = Math.min(Math.max(previewH, 20), 80);
  const clampedW = Math.round(clampedH * ratio);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="flex flex-col gap-3 border border-black/10 bg-[#F4EDE6] p-4 sm:p-5"
    >
      <div className="flex h-[90px] items-center justify-center">
        <div
          className="flex items-center justify-center border-[1.5px] border-dashed border-black/20 bg-black/[0.07]"
          style={{
            width: Math.min(clampedW, 120),
            height: Math.min(clampedH, 80),
          }}
        >
          <span className="text-[0.4rem] tracking-[0.08em] text-[#111]/30">
            {fmt.w}:{fmt.h}
          </span>
        </div>
      </div>
      <div>
        <div className="font-accent text-[clamp(0.85rem,1.6vw,1.15rem)] leading-tight text-[#111]">{fmt.label}</div>
        {fmt.note ? <div className="mt-1 text-[0.5rem] tracking-[0.08em] text-[#FF6FAF]">{fmt.note}</div> : null}
      </div>
      <button type="button" onClick={copy} className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left">
        <span className="text-[0.75rem] font-bold tracking-[0.08em] text-[#111]/55">{label}</span>
        {copied ? <Check size={12} strokeWidth={2.5} color={PINK} /> : <Copy size={11} strokeWidth={2} className="text-[#111]/30" />}
      </button>
    </motion.div>
  );
}

function Calculator({ selected }: { selected: Format | null }) {
  const [widthIn, setWidthIn] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [mode, setMode] = useState<"w" | "h">("w");

  const ratio = selected ? selected.w / selected.h : 16 / 9;
  const ratioStr = selected ? `${selected.w}:${selected.h}` : "16:9";

  const calcHeight = (w: string) => {
    const n = parseFloat(w);
    return Number.isNaN(n) ? "" : Math.round(n / ratio).toString();
  };
  const calcWidth = (h: string) => {
    const n = parseFloat(h);
    return Number.isNaN(n) ? "" : Math.round(n * ratio).toString();
  };

  const result = mode === "w" ? { label: "ALTO", value: calcHeight(widthIn) } : { label: "ANCHO", value: calcWidth(heightIn) };

  return (
    <div className="flex flex-col gap-5 border border-black/10 p-6 sm:p-8">
      <div>
        <div className="font-accent text-[clamp(1rem,1.8vw,1.35rem)] tracking-wide text-[#111]">Calculadora</div>
        <div className="mt-1 text-[0.6rem] text-[#111]/40">
          Ratio activo: <strong>{ratioStr}</strong>
          {selected ? ` — ${selected.platform} · ${selected.label}` : " (personalizado)"}
        </div>
      </div>
      <div className="flex gap-2">
        {(["w", "h"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className="border-[1.5px] px-3 py-1.5 text-[0.55rem] font-extrabold uppercase tracking-[0.14em] transition-colors"
            style={{
              background: mode === m ? INK : "transparent",
              color: mode === m ? BEIGE : INK,
              borderColor: mode === m ? INK : "rgba(17,17,17,0.2)",
            }}
          >
            {m === "w" ? "Ingreso ancho" : "Ingreso alto"}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/35">{mode === "w" ? "Ancho (px)" : "Alto (px)"}</label>
          <input
            type="number"
            min={1}
            value={mode === "w" ? widthIn : heightIn}
            onChange={(e) => (mode === "w" ? setWidthIn(e.target.value) : setHeightIn(e.target.value))}
            placeholder="ej. 1200"
            className="w-32 border-0 border-b-2 border-[#FF6FAF] bg-transparent py-1 font-accent text-2xl text-[#111] outline-none sm:text-3xl"
          />
        </div>
        <span className="pb-2 text-2xl text-[#111]/20">×</span>
        <div className="flex flex-col gap-1 opacity-60">
          <label className="text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/35">{result.label} (calculado)</label>
          <div className="min-w-[120px] border-b-2 border-black/10 py-1 font-accent text-2xl text-[#FF6FAF] sm:text-3xl">{result.value || "—"}</div>
        </div>
      </div>
      {result.value ? (
        <p className="text-sm text-[#111]/50">
          Resultado:{" "}
          <strong className="text-[#111]">
            {mode === "w" ? `${widthIn} × ${result.value}` : `${result.value} × ${heightIn}`} px
          </strong>
        </p>
      ) : null}
    </div>
  );
}

export function AspectRatioTool() {
  const [activePlatform, setActivePlatform] = useState("Instagram");
  const [selectedFmt, setSelectedFmt] = useState<Format | null>(null);
  const filtered = FORMATS.filter((f) => f.platform === activePlatform);

  return (
    <ToolLayout toolName="Relación de aspecto">
      <div className="flex flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-accent text-[clamp(1.75rem,5vw,3.5rem)] leading-[0.9] text-[#111]">
            Relaciones
            <br />
            <span className="text-[#FF6FAF]" style={{ fontStyle: "italic" }}>
              de aspecto.
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#111]/50">Tamaños para redes. Clic en una card para fijar el ratio en la calculadora.</p>
        </motion.div>

        <Calculator selected={selectedFmt} />

        <div>
          <p className="mb-2 text-[0.44rem] font-extrabold uppercase tracking-[0.22em] text-[#111]/35">Plataforma</p>
          <div className="flex flex-wrap gap-2">
            {PLATFORMS.map((p) => {
              const active = activePlatform === p;
              const col = PLATFORM_COLORS[p] ?? INK;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setActivePlatform(p);
                    setSelectedFmt(null);
                  }}
                  className="border-[1.5px] px-3 py-2 text-[0.62rem] font-bold uppercase tracking-[0.1em] transition-colors"
                  style={{
                    background: active ? col : "transparent",
                    color: active ? "#fff" : INK,
                    borderColor: active ? col : "rgba(17,17,17,0.2)",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-3 text-[0.44rem] font-extrabold uppercase tracking-[0.22em] text-[#111]/35">
            Formatos — {activePlatform} ({filtered.length})
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,160px),1fr))] gap-3 sm:gap-4">
            {filtered.map((fmt) => (
              <motion.div
                key={`${fmt.platform}-${fmt.label}`}
                onClick={() => setSelectedFmt(selectedFmt?.label === fmt.label && selectedFmt?.platform === fmt.platform ? null : fmt)}
                className="cursor-pointer transition-transform hover:scale-[1.02]"
                style={{
                  outline: selectedFmt?.label === fmt.label && selectedFmt?.platform === fmt.platform ? `2px solid ${PINK}` : "none",
                  outlineOffset: 2,
                }}
              >
                <FormatCard fmt={fmt} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border border-black/10 px-4 py-3 text-sm text-[#111]/40">
          <span className="text-[#FF6FAF]">✦</span>
          <p className="m-0 leading-relaxed">Clic en las dimensiones de una card las copia. Clic en la card activa el ratio en la calculadora.</p>
        </div>
      </div>
    </ToolLayout>
  );
}
