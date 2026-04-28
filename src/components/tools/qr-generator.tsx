"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { QRCodeCanvas } from "qrcode.react";
import { Download, Link, Type, Mail, Phone } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ToolLayout, TOOL_THEME } from "@/components/tools/tool-layout";
import { dictionaries } from "@/i18n/messages";
import { useLocale } from "@/i18n/locale-provider";

const { BEIGE, INK, PINK } = TOOL_THEME;

function compositeQrWithFooterPng(source: HTMLCanvasElement, footerText: string, footerBg: string): string {
  const w = source.width;
  const h = source.height;
  const footerH = Math.max(Math.round(h * 0.2), 24);

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h + footerH;
  const ctx = out.getContext("2d");
  if (!ctx) return source.toDataURL("image/png");

  ctx.clearRect(0, 0, out.width, out.height);
  ctx.drawImage(source, 0, 0);
  ctx.fillStyle = footerBg;
  ctx.fillRect(0, h, w, footerH);

  const fontPx = Math.max(10, Math.min(22, Math.round(w * 0.034)));
  ctx.font = `500 ${fontPx}px system-ui, -apple-system, sans-serif`;
  ctx.fillStyle = "rgba(17,17,17,0.52)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(footerText, w / 2, h + footerH / 2);

  return out.toDataURL("image/png");
}

type QRType = "url" | "text" | "email" | "phone";

function buildQRValue(type: QRType, value: string): string {
  if (!value.trim()) return " ";
  switch (type) {
    case "email":
      return `mailto:${value}`;
    case "phone":
      return `tel:${value.replace(/\s/g, "")}`;
    default:
      return value;
  }
}

const SIZES = [128, 192, 256, 320, 512, 640, 800, 1000];



export function QRGenerator() {
  const searchParams = useSearchParams();
  const stripBranding = searchParams.get("freeQr")?.toLowerCase() === "true";
  const showAttribution = !stripBranding;

  const { locale } = useLocale();
  const tm = useMemo(() => dictionaries[locale].tools as unknown as Record<string, string>, [locale]);
  const atrLine = tm.qrAttributionFooter ?? "Qr gratis en lasgirlsplus.com";
  const toolQrName = dictionaries[locale].tools.qr.name;

  const typesList = useMemo(
    (): { id: QRType; label: string; icon: typeof Link; placeholder: string }[] => [
      { id: "url", label: tm.typeUrl, icon: Link, placeholder: tm.phUrl },
      { id: "text", label: tm.typeText, icon: Type, placeholder: tm.phText },
      { id: "email", label: tm.typeEmail, icon: Mail, placeholder: tm.phEmail },
      { id: "phone", label: tm.typePhone, icon: Phone, placeholder: tm.phPhone },
    ],
    [tm],
  );

  const PRESETS = useMemo(
    () => [
      { label: tm.presetClassic, fg: "#111111", bg: "#FFFFFF" },
      { label: tm.presetBeige, fg: "#111111", bg: "#F4EDE6" },
      { label: tm.presetPink, fg: "#111111", bg: "#FF6FAF" },
      { label: tm.presetBlack, fg: "#F4EDE6", bg: "#111111" },
      { label: tm.presetIndigo, fg: "#FFFFFF", bg: "#4F46E5" },
    ],
    [tm],
  );

  const TRANSPARENT_QR_PRESETS = useMemo(
    () => [
      { label: tm.transpWhite, fg: "#FFFFFF", hint: tm.transpHintDark },
      { label: tm.transpBlack, fg: "#111111", hint: tm.transpHintLight },
      { label: tm.transpPink, fg: "#FF6FAF", hint: tm.transpHintBrand },
    ],
    [tm],
  );

  const [type, setType] = useState<QRType>("url");
  const [value, setValue] = useState("");
  const [fgColor, setFgColor] = useState("#111111");
  const [bgColor, setBgColor] = useState("#FFFFFF");
  const [transparentBg, setTransparentBg] = useState(false);
  const [size, setSize] = useState(256);
  const [copied, setCopied] = useState(false);
  const [fgHexDraft, setFgHexDraft] = useState("#111111");

  const canvasRef = useRef<HTMLDivElement>(null);
  const qrValue = buildQRValue(type, value);
  const hasValue = value.trim().length > 0;
  const effectiveBg = transparentBg ? "#00000000" : bgColor;

  const download = useCallback(() => {
    const canvas = canvasRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = showAttribution ? compositeQrWithFooterPng(canvas, atrLine, BEIGE) : canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `qr-${type}-${size}px-${Date.now()}.png`;
    link.click();
  }, [type, size, showAttribution, atrLine]);

  const copyValue = () => {
    if (!hasValue) return;
    void navigator.clipboard.writeText(qrValue).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const normalizeFgHex = (raw: string): string | null => {
    const t = raw.trim();
    if (!t) return null;
    const hex = (t.startsWith("#") ? t : `#${t}`).toUpperCase();
    return /^#[0-9A-F]{6}$/.test(hex) ? hex : null;
  };

  const commitFgHex = (raw: string) => {
    const hex = normalizeFgHex(raw);
    if (hex) {
      setFgColor(hex);
      setFgHexDraft(hex);
    } else {
      setFgHexDraft(fgColor);
    }
  };

  useEffect(() => {
    setFgHexDraft(fgColor);
  }, [fgColor]);

  const TypeIcon = typesList.find((row) => row.id === type)?.icon ?? Link;

  return (
    <ToolLayout toolName={toolQrName}>
      <div className="px-4 py-10 sm:px-10 sm:py-14">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="mb-10 sm:mb-14">
          <h1 className="font-accent text-[clamp(1.75rem,5vw,3.5rem)] leading-[0.9] tracking-tight text-[#111]">
            {tm.qrPageTitle1}
            <br />
            <span className="text-[#FF6FAF]" style={{ fontStyle: "italic" }}>
              {tm.qrPageAccent}
            </span>
          </h1>
          <p className="mt-2 max-w-lg text-sm leading-relaxed text-[#111]/50">
            {tm.qrIntro}{" "}
            {showAttribution ? (
              <>
                {tm.qrIntroAttribution.replace(/\{line\}/g, atrLine)}
                <code className="rounded bg-black/5 px-1 py-0.5 font-mono text-[0.8em]">{tm.qrFreeQrParamHint}</code>
                {locale === "es" ? " en la URL." : " to the URL."}
              </>
            ) : (
              <> {tm.qrIntroNoAttribution}</>
            )}
          </p>
        </motion.div>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(280px,1fr)_minmax(260px,420px)] lg:gap-12">
          <div className="flex flex-col gap-6">
            <fieldset className="border-0 p-0">
              <legend className="mb-2 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrTypeLegend}</legend>
              <div className="flex flex-wrap gap-2">
                {typesList.map((tp) => {
                  const TIcon = tp.icon;
                  const active = type === tp.id;
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => setType(tp.id)}
                      className="flex items-center gap-1.5 border-[1.5px] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.1em] transition-colors"
                      style={{
                        background: active ? INK : "transparent",
                        color: active ? BEIGE : INK,
                        borderColor: active ? INK : "rgba(17,17,17,0.2)",
                      }}
                    >
                      <TIcon size={11} strokeWidth={2} />
                      {tp.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div>
              <label className="mb-2 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelContent}</label>
              <div className="relative">
                <TypeIcon size={14} strokeWidth={1.5} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#111]/30" />
                <input
                  type="text"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={typesList.find((tp) => tp.id === type)?.placeholder}
                  className="w-full border-[1.5px] border-black/20 bg-transparent py-3 pl-10 pr-3 text-sm text-[#111] outline-none focus:border-[#FF6FAF]"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelSolidBg}</label>
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    title={p.label}
                    onClick={() => {
                      setFgColor(p.fg);
                      setBgColor(p.bg);
                      setTransparentBg(false);
                    }}
                    className="flex h-9 w-9 items-center justify-center border-2 transition-colors"
                    style={{
                      background: p.bg,
                      borderColor: fgColor === p.fg && bgColor === p.bg && !transparentBg ? PINK : "rgba(17,17,17,0.15)",
                    }}
                  >
                    <span className="block h-3.5 w-3.5 rounded-sm" style={{ background: p.fg }} />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelTransparentQr}</label>
              <p className="mb-2 text-xs leading-snug text-[#111]/45">{tm.qrTransparentAlphaHelp}</p>
              <div className="flex flex-wrap gap-2">
                {TRANSPARENT_QR_PRESETS.map((p) => {
                  const active = transparentBg && fgColor.toUpperCase() === p.fg.toUpperCase();
                  return (
                    <button
                      key={p.label}
                      type="button"
                      title={p.hint ?? p.label}
                      onClick={() => {
                        setFgColor(p.fg);
                        setTransparentBg(true);
                      }}
                      className="flex items-center gap-2 border-[1.5px] px-3 py-2 text-[0.65rem] font-bold uppercase tracking-[0.08em] transition-colors"
                      style={{
                        background: active ? INK : "transparent",
                        color: active ? BEIGE : INK,
                        borderColor: active ? INK : "rgba(17,17,17,0.2)",
                      }}
                    >
                      <span className="block h-4 w-4 shrink-0 rounded-sm border border-black/15" style={{ background: p.fg }} />
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-[#111]/80">
              <input type="checkbox" checked={transparentBg} onChange={(e) => setTransparentBg(e.target.checked)} className="rounded border-black/30" />
              {tm.qrCheckboxTransparent}
            </label>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelQrColor}</label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="color"
                    value={/^#[0-9A-Fa-f]{6}$/i.test(fgColor) ? fgColor : "#111111"}
                    onChange={(e) => {
                      const v = e.target.value.toUpperCase();
                      setFgColor(v);
                      setFgHexDraft(v);
                    }}
                    className="h-9 w-9 cursor-pointer border-0 bg-transparent p-0"
                    title="Selector"
                  />
                  <input
                    type="text"
                    inputMode="text"
                    maxLength={7}
                    value={fgHexDraft}
                    onChange={(e) => setFgHexDraft(e.target.value.toUpperCase())}
                    onBlur={() => commitFgHex(fgHexDraft)}
                    onKeyDown={(e) => e.key === "Enter" && commitFgHex(fgHexDraft)}
                    placeholder="#FFFFFF"
                    className="min-w-0 flex-1 border-[1.5px] border-black/20 bg-transparent px-2 py-2 font-mono text-xs uppercase text-[#111] outline-none focus:border-[#FF6FAF]"
                    aria-label={tm.qrAriaFgHex}
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelBgSolid}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => {
                      setBgColor(e.target.value.toUpperCase());
                      setTransparentBg(false);
                    }}
                    disabled={transparentBg}
                    className="h-9 w-9 cursor-pointer border-0 bg-transparent p-0 disabled:opacity-40"
                  />
                  <span className="text-xs uppercase tracking-wider text-[#111]/55">{transparentBg ? tm.qrTransparentBgLabel : bgColor}</span>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-[0.52rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/40">{tm.qrLabelSize.replace(/\{size\}/g, String(size))}</label>
              <div className="flex flex-wrap gap-2">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className="border-[1.5px] px-2.5 py-1.5 text-[0.62rem] font-bold tracking-wide transition-colors"
                    style={{
                      background: size === s ? INK : "transparent",
                      color: size === s ? BEIGE : INK,
                      borderColor: size === s ? INK : "rgba(17,17,17,0.2)",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={download}
                disabled={!hasValue}
                className="flex items-center gap-2 border-0 px-5 py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40"
                style={{ background: hasValue ? INK : "rgba(17,17,17,0.1)", color: hasValue ? BEIGE : "rgba(17,17,17,0.3)" }}
              >
                <Download size={14} strokeWidth={2} />
                {tm.qrDownloadPng}
              </button>
              <button
                type="button"
                onClick={copyValue}
                disabled={!hasValue}
                className="border-[1.5px] border-black/30 bg-transparent px-4 py-3 text-[0.68rem] font-extrabold uppercase tracking-[0.14em] disabled:opacity-40"
                style={{ color: hasValue ? (copied ? PINK : INK) : "rgba(17,17,17,0.3)" }}
              >
                {copied ? tm.qrCopied : tm.qrCopyPayload}
              </button>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="flex flex-col items-center gap-4 border border-black/10 p-6 lg:sticky lg:top-24"
            style={{
              backgroundImage: transparentBg
                ? "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)"
                : undefined,
              backgroundSize: transparentBg ? "16px 16px" : undefined,
              backgroundPosition: transparentBg ? "0 0,0 8px,8px -8px,-8px 0px" : undefined,
              backgroundColor: transparentBg ? "#e8e8e8" : undefined,
            }}
          >
            <div ref={canvasRef} className="max-h-[70vh] max-w-full overflow-auto leading-none">
              <AnimatePresence mode="wait">
                <motion.div
                  key={`${qrValue}-${fgColor}-${effectiveBg}-${size}-${showAttribution}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.25 }}
                  className="mx-auto"
                  style={{ width: size, maxWidth: "100%" }}
                >
                  <QRCodeCanvas
                    value={qrValue}
                    size={size}
                    fgColor={fgColor}
                    bgColor={effectiveBg}
                    level="M"
                    style={{ display: "block", width: "100%", height: "auto", maxWidth: "100%" }}
                  />
                  {showAttribution && (
                    <div
                      className="box-border w-full text-center font-sans font-medium leading-snug text-[#111]/55"
                      style={{
                        background: BEIGE,
                        padding: `${Math.max(6, Math.round(size * 0.035))}px 8px`,
                        fontSize: Math.max(9, Math.min(14, Math.round(size * 0.032))),
                      }}
                    >
                      {atrLine}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
            {!hasValue ? (
              <p className="text-center text-sm text-[#111]/30">{tm.qrEmptyPrompt}</p>
            ) : (
              <p className="max-w-[280px] break-all text-center text-[0.62rem] text-[#111]/40">{qrValue.length > 60 ? `${qrValue.slice(0, 60)}…` : qrValue}</p>
            )}
          </motion.div>
        </div>
      </div>
    </ToolLayout>
  );
}
