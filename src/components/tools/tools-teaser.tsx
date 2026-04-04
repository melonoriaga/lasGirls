"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";
import { TOOLS_LIST } from "@/components/tools/tools-data";

const BEIGE = "#F4EDE6";
const INK = "#111111";
const PINK = "#FF6FAF";

export function ToolsTeaser() {
  return (
    <section className="border-y-[3px] border-[#111]" style={{ background: INK }}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.08] px-4 py-3 sm:px-10">
        <span className="text-[0.42rem] font-extrabold uppercase tracking-[0.26em]" style={{ color: PINK }}>
          ✦ Herramientas gratuitas
        </span>
        <span className="text-[0.42rem] font-bold uppercase tracking-[0.16em] text-white/25">Sin registro · Gratis</span>
      </div>

      <div className="grid min-h-[clamp(110px,18vh,160px)] md:grid-cols-[minmax(140px,240px)_1fr_1fr_1fr]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.55 }}
          className="border-b border-white/[0.08] md:border-b-0 md:border-r"
        >
          <Link
            href="/herramientas"
            className="flex h-full min-h-[120px] flex-col justify-between p-5 text-left transition-colors hover:bg-[#FF6FAF]/[0.08] md:min-h-0"
          >
            <div className="font-accent text-[clamp(1.3rem,3vw,2.2rem)] uppercase leading-[0.9]" style={{ color: BEIGE }}>
              Ver
              <br />
              <span className="text-[#FF6FAF]">todas</span>
            </div>
            <div className="flex items-center gap-1 text-[0.46rem] font-extrabold uppercase tracking-[0.18em] text-white/30">
              Herramientas
              <ArrowRight size={10} strokeWidth={2.5} />
            </div>
          </Link>
        </motion.div>

        {TOOLS_LIST.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.08 + i * 0.08 }}
              className={`border-b border-white/[0.08] p-5 transition-colors hover:bg-[#FF6FAF]/10 md:border-b-0 ${i < TOOLS_LIST.length - 1 ? "md:border-r md:border-white/[0.08]" : ""}`}
            >
              <Link href={`/herramientas/${tool.slug}`} className="flex h-full flex-col justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center border border-white/10 bg-white/[0.06]">
                    <Icon size={16} strokeWidth={1.5} color={PINK} />
                  </div>
                  <div>
                    <p className="font-accent text-[clamp(0.85rem,1.6vw,1.15rem)] uppercase leading-tight" style={{ color: BEIGE }}>
                      {tool.name}
                    </p>
                    <p className="mt-1 text-[0.58rem] leading-snug text-white/40">{tool.desc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[0.44rem] font-extrabold uppercase tracking-[0.16em] text-white/30">
                  Usar gratis
                  <ArrowRight size={10} strokeWidth={2.5} className="text-white/30" />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
