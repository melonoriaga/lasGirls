"use client";

import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Check, Download } from "lucide-react";
import { ToolLayout, TOOL_THEME } from "@/components/tools/tool-layout";
import {
  hexToRgb,
  rgbToHsl,
  generateTints,
  generateShades,
  generateComplementary,
  generateAnalogous,
  generateTriadic,
  isValidHex,
  normalizeHexInput,
  textColor,
} from "@/lib/tools/color-math";
import { useDictionary } from "@/i18n/locale-provider";

const { INK, PINK } = TOOL_THEME;

function Swatch({ hex, label, large = false }: { hex: string; label?: string; large?: boolean }) {
  const dict = useDictionary();
  const tm = useMemo(() => dict.tools as unknown as Record<string, string>, [dict]);
  const [copied, setCopied] = useState(false);

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(hex.toUpperCase()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [hex]);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      onClick={copy}
      title={tm.copySwatchAria?.replace("{hex}", hex.toUpperCase()) ?? `Copy ${hex.toUpperCase()}`}
      className="relative flex flex-col items-start justify-end border-0 text-left"
      style={{
        background: hex,
        padding: large ? "1rem 1rem 0.8rem" : "0.5rem 0.5rem 0.4rem",
        height: large ? 120 : 60,
      }}
    >
      <AnimatePresence>
        {copied ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/20"
          >
            <Check size={large ? 22 : 14} color="#fff" strokeWidth={2.5} />
          </motion.div>
        ) : null}
      </AnimatePresence>
      <div
        className={`font-sans font-bold uppercase leading-snug ${large ? "text-[0.72rem]" : "text-[0.5rem]"}`}
        style={{ color: textColor(hex), opacity: large ? 0.85 : 0.7 }}
      >
        {hex.toUpperCase()}
        {label ? <div className="mt-px text-[0.8em] opacity-70">{label}</div> : null}
      </div>
      {!copied ? (
        <Copy
          size={large ? 12 : 8}
          strokeWidth={2}
          color={textColor(hex)}
          className={`absolute opacity-45 ${large ? "right-3 top-3" : "right-1.5 top-1.5"}`}
        />
      ) : null}
    </motion.button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-2 text-[0.44rem] font-extrabold uppercase tracking-[0.22em] text-[#111]/35">{children}</div>;
}

const SEED_COLORS = ["#FF6FAF", "#4F46E5", "#059669", "#D97706", "#DC2626", "#7C3AED"];

function collectPaletteHexes(
  hex: string,
  tints: string[],
  shades: string[],
  comp: string,
  ana: string[],
  tri: string[],
  extras: string[],
): string[] {
  const merged = [...tints, hex, ...shades, comp, ...ana, ...tri, ...extras.filter((c) => isValidHex(c))];
  return [...new Set(merged)];
}

function drawPalettePng(
  colors: string[],
  width: number,
  height: number,
  transparent: boolean,
  solidBg: string,
): string {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";
  if (!transparent) {
    ctx.fillStyle = solidBg;
    ctx.fillRect(0, 0, width, height);
  }
  const pad = Math.round(Math.min(width, height) * 0.04);
  const innerW = width - pad * 2;
  const innerH = height - pad * 2;
  const n = colors.length;
  const cols = Math.max(1, Math.ceil(Math.sqrt((n * innerW) / innerH)));
  const rows = Math.ceil(n / cols);
  const cellW = innerW / cols;
  const cellH = innerH / rows;
  colors.forEach((c, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    ctx.fillStyle = c;
    ctx.fillRect(pad + col * cellW, pad + row * cellH, cellW, cellH);
  });
  return canvas.toDataURL("image/png");
}

export function ColorPaletteTool() {
  const dict = useDictionary();
  const tm = useMemo(() => dict.tools as unknown as Record<string, string>, [dict]);
  const toolName = dict.tools.paleta.name;

  const [hex, setHex] = useState("#FF6FAF");
  const [input, setInput] = useState("#FF6FAF");
  const [error, setError] = useState(false);
  const [extraInput, setExtraInput] = useState("");
  const [customColors, setCustomColors] = useState<string[]>([]);

  const [exportW, setExportW] = useState(800);
  const [exportH, setExportH] = useState(800);
  const [exportTransparent, setExportTransparent] = useState(false);
  const [exportBg, setExportBg] = useState("#FFFFFF");

  const applyHex = (val: string) => {
    const v = normalizeHexInput(val);
    setInput(v);
    if (isValidHex(v)) {
      setHex(v);
      setError(false);
    } else setError(true);
  };

  const addCustomColor = () => {
    const v = normalizeHexInput(extraInput);
    if (!isValidHex(v)) return;
    if (customColors.includes(v)) return;
    setCustomColors((c) => [...c, v]);
    setExtraInput("");
  };

  const tints = generateTints(hex);
  const shades = generateShades(hex);
  const [comp] = generateComplementary(hex);
  const [ana1, ana2] = generateAnalogous(hex);
  const [tri1, tri2] = generateTriadic(hex);

  const allForExport = useMemo(
    () => collectPaletteHexes(hex, tints, shades, comp, [ana1, ana2], [tri1, tri2], customColors),
    [hex, tints, shades, comp, ana1, ana2, tri1, tri2, customColors],
  );

  const downloadPng = () => {
    const w = Math.min(1000, Math.max(100, exportW));
    const h = Math.min(1000, Math.max(100, exportH));
    const dataUrl = drawPalettePng(allForExport, w, h, exportTransparent, exportBg);
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `paleta-lasgirls-${w}x${h}-${Date.now()}.png`;
    a.click();
  };

  return (
    <ToolLayout toolName={toolName}>
      <div className="flex flex-col gap-10 px-4 py-10 sm:gap-12 sm:px-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-accent text-[clamp(1.75rem,5vw,3.5rem)] leading-[0.9] text-[#111]">
            {tm.paletteTitle1}
            <br />
            <span className="text-[#FF6FAF]" style={{ fontStyle: "italic" }}>
              {tm.paletteTitleAccent}
            </span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#111]/50">{tm.paletteIntro}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.08 }} className="flex flex-wrap items-center gap-4">
          <input type="color" value={hex} onChange={(e) => applyHex(e.target.value)} className="h-12 w-12 cursor-pointer border border-black/20 bg-transparent p-0.5" />
          <div className="flex flex-col gap-1">
            <span className="text-[0.44rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/35">{tm.paletteBaseColour}</span>
            <input
              type="text"
              value={input}
              maxLength={7}
              onChange={(e) => applyHex(e.target.value)}
              className={`w-28 border-0 border-b-2 bg-transparent font-sans text-base font-bold uppercase tracking-[0.12em] outline-none ${error ? "border-red-600 text-red-600" : "border-[#111] text-[#111]"}`}
            />
          </div>
          <div className="hidden h-9 w-px bg-black/10 sm:block" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/28">{tm.paletteExamplesLabel}</span>
            {SEED_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                title={c}
                onClick={() => {
                  setHex(c);
                  setInput(c);
                  setError(false);
                }}
                className="h-6 w-6 rounded-full border-[1.5px] transition-transform hover:scale-110"
                style={{
                  background: c,
                  borderColor: hex === c ? INK : "rgba(17,17,17,0.12)",
                }}
              />
            ))}
          </div>
        </motion.div>

        <div className="rounded-lg border border-black/10 bg-[#F4EDE6]/80 p-5">
          <SectionLabel>{tm.paletteCustomColours}</SectionLabel>
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[0.5rem] font-bold uppercase tracking-[0.12em] text-[#111]/40">{tm.paletteHexField}</span>
              <input
                type="text"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                placeholder="#00B894"
                className="w-36 border border-black/20 bg-white/80 px-3 py-2 text-sm uppercase text-[#111] outline-none focus:border-[#FF6FAF]"
              />
            </div>
            <button
              type="button"
              onClick={addCustomColor}
              className="border-[1.5px] border-[#111] bg-[#111] px-4 py-2 text-[0.65rem] font-extrabold uppercase tracking-[0.12em] text-[#F4EDE6]"
            >
              {tm.paletteAddBtn}
            </button>
          </div>
          {customColors.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {customColors.map((c) => (
                <div key={c} className="flex items-center gap-1 rounded border border-black/10 bg-white/60 pl-2">
                  <span className="font-mono text-xs">{c}</span>
                  <button type="button" className="px-2 py-1 text-xs text-red-600 hover:bg-red-50" onClick={() => setCustomColors((x) => x.filter((y) => y !== c))}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-lg border border-black/10 p-5">
          <SectionLabel>{tm.paletteExportLegend}</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1 text-[0.65rem] font-semibold text-[#111]/70">
              {tm.paletteExportWidth}
              <input
                type="number"
                min={100}
                max={1000}
                value={exportW}
                onChange={(e) => setExportW(Number(e.target.value))}
                className="border border-black/20 bg-white px-3 py-2 text-sm text-[#111]"
              />
            </label>
            <label className="flex flex-col gap-1 text-[0.65rem] font-semibold text-[#111]/70">
              {tm.paletteExportHeight}
              <input
                type="number"
                min={100}
                max={1000}
                value={exportH}
                onChange={(e) => setExportH(Number(e.target.value))}
                className="border border-black/20 bg-white px-3 py-2 text-sm text-[#111]"
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111]/80">
              <input type="checkbox" checked={exportTransparent} onChange={(e) => setExportTransparent(e.target.checked)} />
              {tm.paletteExportTransparentBg}
            </label>
            <label className={`flex flex-col gap-1 text-[0.65rem] font-semibold text-[#111]/70 ${exportTransparent ? "opacity-40" : ""}`}>
              {tm.paletteExportSolidBgColour}
              <input type="color" value={exportBg} disabled={exportTransparent} onChange={(e) => setExportBg(e.target.value)} className="h-10 w-full max-w-[120px] cursor-pointer disabled:cursor-not-allowed" />
            </label>
          </div>
          <button
            type="button"
            onClick={downloadPng}
            className="mt-4 inline-flex items-center gap-2 border-0 bg-[#111] px-5 py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-[#F4EDE6]"
          >
            <Download size={16} />
            {tm.paletteDownloadSamples.replace("{count}", String(allForExport.length))}
          </button>
        </div>

        <div>
          <SectionLabel>{tm.paletteSwatchSection}</SectionLabel>
          <div className="grid grid-cols-1 border border-black/10 sm:grid-cols-[min(100%,280px)_1fr]">
            <Swatch hex={hex} large />
            <div className="flex flex-col justify-center gap-1 border-t border-black/10 p-4 sm:border-l sm:border-t-0">
              {(() => {
                const [r, g, b] = hexToRgb(hex);
                const [h, s, l] = rgbToHsl(r, g, b);
                return (
                  <>
                    <p className="font-mono text-[0.72rem] text-[#111]/50">
                      <span className="opacity-50">HEX</span> {hex.toUpperCase()}
                    </p>
                    <p className="font-mono text-[0.72rem] text-[#111]/50">
                      <span className="opacity-50">RGB</span> {r}, {g}, {b}
                    </p>
                    <p className="font-mono text-[0.72rem] text-[#111]/50">
                      <span className="opacity-50">HSL</span> {Math.round(h)}°, {Math.round(s)}%, {Math.round(l)}%
                    </p>
                  </>
                );
              })()}
            </div>
          </div>
        </div>

        <div>
          <SectionLabel>{tm.paletteTints}</SectionLabel>
          <div className="grid grid-cols-5 sm:grid-cols-9">{tints.map((t, i) => <Swatch key={i} hex={t} />)}</div>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-9">
          <Swatch hex={hex} label={tm.paletteLegendBaseMark} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-[60px] border-r border-black/[0.04] bg-black/[0.025]" />
          ))}
        </div>

        <div>
          <SectionLabel>{tm.paletteShades}</SectionLabel>
          <div className="grid grid-cols-5 sm:grid-cols-9">{shades.map((s, i) => <Swatch key={i} hex={s} />)}</div>
        </div>

        {customColors.length > 0 ? (
          <div>
            <SectionLabel>{tm.paletteExtraCustom}</SectionLabel>
            <div className="flex flex-wrap gap-2">{customColors.map((c) => <Swatch key={c} hex={c} large />)}</div>
          </div>
        ) : null}

        <div>
          <SectionLabel>{tm.paletteHarmonies}</SectionLabel>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: tm.harmComp, colors: [comp] },
              { label: tm.harmAnalogous, colors: [ana1, ana2] },
              { label: tm.harmTriadic, colors: [tri1, tri2] },
            ].map((g) => (
              <div key={g.label}>
                <div className="mb-2 text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/30">{g.label}</div>
                <div className="flex gap-1">
                  {g.colors.map((c, i_c) => (
                    <div key={`${g.label}-${i_c}`} className="min-w-0 flex-1">
                      <Swatch hex={c} large />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border border-black/10 px-4 py-3 text-sm text-[#111]/45">
          <span className="text-[#FF6FAF]">✦</span>
          <p className="m-0 leading-relaxed">{tm.paletteTip}</p>
        </div>
      </div>
    </ToolLayout>
  );
}
