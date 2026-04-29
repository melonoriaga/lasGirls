"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { getToolsForLocale, toolStrings } from "@/components/tools/tools-data";
import { dictionaries } from "@/i18n/messages";
import { useLocale } from "@/i18n/locale-provider";
import { TOOL_THEME } from "@/components/tools/tool-layout";

const { BEIGE } = TOOL_THEME;

export function ToolsHub() {
  const { locale } = useLocale();
  const toolsList = useMemo(() => getToolsForLocale(locale), [locale]);
  const h = toolStrings(locale);
  const hubTitle = dictionaries[locale].tools.hubTitle;

  return (
    <div className="min-h-screen pt-16 sm:pt-20" style={{ background: BEIGE }}>
      <header className="grid items-end gap-8 border-b border-black/10 px-4 py-12 sm:grid-cols-[1fr_auto] sm:px-10 sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <p className="mb-3 text-[0.54rem] font-extrabold uppercase tracking-[0.22em] text-[#111]/35">{h.hubEyebrow}</p>
          <h1 className="font-accent text-[clamp(2.5rem,9vw,6rem)] leading-[0.88] tracking-tight text-[#111]">
            {hubTitle}
            <br />
            <span className="text-[#FF6FAF]" style={{ fontStyle: "italic" }}>
              {h.hubAccent}
            </span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-[#111]/50">{h.hubIntro}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="pb-2 text-center sm:text-right"
        >
          <div className="font-accent text-[clamp(3rem,6vw,5rem)] leading-none text-[#111]/[0.06]">
            0{toolsList.length}
          </div>
          <p className="-mt-1 text-[0.46rem] font-extrabold uppercase tracking-[0.2em] text-[#111]/25">{h.hubCountSuffix}</p>
        </motion.div>
      </header>

      <div className="grid gap-4 px-4 py-10 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3 sm:px-10">
        {toolsList.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div key={tool.slug} initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.55, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}>
              <Link
                href={`/herramientas/${tool.slug}`}
                className="group relative flex h-full flex-col gap-4 border border-black/15 bg-[#F4EDE6] p-6 pb-8 text-left transition-all hover:-translate-y-1 hover:border-black/35 hover:shadow-[0_12px_40px_rgba(17,17,17,0.08)] sm:p-8"
              >
                <span className="absolute right-4 top-4 border border-[#FF6FAF] px-2 py-0.5 text-[0.44rem] font-extrabold uppercase tracking-[0.2em] text-[#FF6FAF]">
                  {tool.tag}
                </span>
                <div className="flex h-12 w-12 items-center justify-center bg-[#111]">
                  <Icon size={22} color={BEIGE} strokeWidth={1.5} />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <h2 className="font-accent text-[clamp(1.15rem,2.5vw,1.75rem)] leading-none text-[#111]">{tool.name}</h2>
                  <p className="text-[0.82rem] leading-relaxed text-[#111]/60">{tool.desc}</p>
                  <p className="text-[0.68rem] leading-snug text-[#111]/38">{tool.detail}</p>
                </div>
                <div className="mt-auto flex items-center gap-1 text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#111]/40">
                  {h.hubUseBtn}
                  <ArrowRight size={12} strokeWidth={2} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-black/10 px-4 py-8 sm:px-10">
        <p className="text-[0.58rem] tracking-[0.1em] text-[#111]/30">{h.hubFooterLead}</p>
        <Link href="/#contacto" className="text-[0.58rem] font-extrabold uppercase tracking-[0.14em] text-[#FF6FAF]">
          {h.hubFooterContact}
        </Link>
      </footer>
    </div>
  );
}
