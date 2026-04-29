"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion } from "motion/react";
import { Copy, Check } from "lucide-react";
import { ToolLayout, TOOL_THEME } from "@/components/tools/tool-layout";
import type { AspectFormatPreset } from "@/components/tools/aspect-ratio-presets";
import { aspectFormats } from "@/components/tools/aspect-ratio-presets";
import { dictionaries, type Locale } from "@/i18n/messages";
import { useLocale } from "@/i18n/locale-provider";

const { BEIGE, INK, PINK } = TOOL_THEME;

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

function toolMap(locale: Locale): Record<string, string> {
  return dictionaries[locale].tools as unknown as Record<string, string>;
}

function FormatsHeading({ tm, activePlatform, count }: { tm: Record<string, string>; activePlatform: string; count: number }) {
  const raw = tm.aspectFormatsHeading ?? "";
  return <span>{raw.replace("{platform}", activePlatform).replace("{count}", String(count))}</span>;
}

function FormatCard({ fmt, tm }: { fmt: AspectFormatPreset; tm: Record<string, string> }) {
  const [copied, setCopied] = useState(false);
  const ratio = fmt.w / fmt.h;
  const dimLabel = `${fmt.w}×${fmt.h}`;

  const copy = useCallback(() => {
    void navigator.clipboard.writeText(dimLabel).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  }, [dimLabel]);

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
      <button type="button" onClick={copy} className="flex cursor-pointer items-center gap-1 border-0 bg-transparent p-0 text-left" aria-label={tm.copySwatchAria?.replace("{hex}", dimLabel) ?? dimLabel}>
        <span className="text-[0.75rem] font-bold tracking-[0.08em] text-[#111]/55">{dimLabel}</span>
        {copied ? <Check size={12} strokeWidth={2.5} color={PINK} /> : <Copy size={11} strokeWidth={2} className="text-[#111]/30" />}
      </button>
    </motion.div>
  );
}

function Calculator({
  selected,
  tm,
}: {
  selected: AspectFormatPreset | null;
  tm: Record<string, string>;
}) {
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

  const result = mode === "w" ? { label: tm.calcLabelHeight ?? "HEIGHT", value: calcHeight(widthIn) } : { label: tm.calcLabelWidth ?? "WIDTH", value: calcWidth(heightIn) };

  const computedSuffix = tm.calcComputedSuffix ?? "";

  return (
    <div className="flex flex-col gap-5 border border-black/10 p-6 sm:p-8">
      <div>
        <div className="font-accent text-[clamp(1rem,1.8vw,1.35rem)] tracking-wide text-[#111]">{tm.aspectCalcHeading}</div>
        <div className="mt-1 text-[0.6rem] text-[#111]/40">
          {tm.aspectRatioActive}{" "}
          <strong>{ratioStr}</strong>
          {selected ? ` — ${selected.platform} · ${selected.label}` : ` ${tm.calcCustomHint ?? ""}`}
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
            {m === "w" ? tm.aspectModeWide : tm.aspectModeTall}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/35">
            {mode === "w" ? tm.aspectLabelWidePx : tm.aspectLabelTallPx}
          </label>
          <input
            type="number"
            min={1}
            value={mode === "w" ? widthIn : heightIn}
            onChange={(e) => (mode === "w" ? setWidthIn(e.target.value) : setHeightIn(e.target.value))}
            placeholder={tm.calcPlaceholderEg}
            className="w-32 border-0 border-b-2 border-[#FF6FAF] bg-transparent py-1 font-accent text-2xl text-[#111] outline-none sm:text-3xl"
          />
        </div>
        <span className="pb-2 text-2xl text-[#111]/20">×</span>
        <div className="flex flex-col gap-1 opacity-60">
          <label className="text-[0.44rem] font-extrabold uppercase tracking-[0.18em] text-[#111]/35">
            {result.label} {computedSuffix}
          </label>
          <div className="min-w-[120px] border-b-2 border-black/10 py-1 font-accent text-2xl text-[#FF6FAF] sm:text-3xl">{result.value || "—"}</div>
        </div>
      </div>
      {result.value ? (
        <p className="text-sm text-[#111]/50">
          {tm.calcResultHeading}{" "}
          <strong className="text-[#111]">
            {mode === "w" ? `${widthIn} × ${result.value}` : `${result.value} × ${heightIn}`} px
          </strong>
        </p>
      ) : null}
    </div>
  );
}

export function AspectRatioTool() {
  const { locale } = useLocale();
  const tm = useMemo(() => toolMap(locale), [locale]);

  const formats = useMemo(() => aspectFormats(locale), [locale]);
  const PLATFORMS = useMemo(() => [...new Set(formats.map((f) => f.platform))], [formats]);

  const [activePlatform, setActivePlatform] = useState(() => PLATFORMS[0] ?? "Instagram");
  const [selectedFmt, setSelectedFmt] = useState<AspectFormatPreset | null>(null);

  const filtered = useMemo(() => formats.filter((f) => f.platform === activePlatform), [formats, activePlatform]);

  useEffect(() => {
    if (!PLATFORMS.includes(activePlatform)) {
      const first = PLATFORMS[0];
      if (first) setActivePlatform(first);
      setSelectedFmt(null);
    }
  }, [PLATFORMS, activePlatform]);

  return (
    <ToolLayout toolName={dictionaries[locale].tools.aspect.name}>
      <div className="flex flex-col gap-8 px-4 py-10 sm:gap-10 sm:px-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="font-accent text-[clamp(1.75rem,5vw,3.5rem)] leading-[0.9] text-[#111]">
            {tm.aspectTitle1}
            <br />
            <span className="text-[#FF6FAF]" style={{ fontStyle: "italic" }}>
              {tm.aspectTitleAccent}
            </span>
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#111]/50">{tm.aspectIntroMicro}</p>
        </motion.div>

        <Calculator selected={selectedFmt} tm={tm} />

        <div>
          <p className="mb-2 text-[0.44rem] font-extrabold uppercase tracking-[0.22em] text-[#111]/35">{tm.aspectPlatformLabel}</p>
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
            <FormatsHeading tm={tm} activePlatform={activePlatform} count={filtered.length} />
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
                <FormatCard fmt={fmt} tm={tm} />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="flex gap-2 border border-black/10 px-4 py-3 text-sm text-[#111]/40">
          <span className="text-[#FF6FAF]">✦</span>
          <p className="m-0 leading-relaxed">{tm.aspectFooterTip}</p>
        </div>
      </div>
    </ToolLayout>
  );
}
