"use client";

import Link from "next/link";
import type { PropsWithChildren } from "react";

const BEIGE = "#F4EDE6";
const INK = "#111111";
const PINK = "#FF6FAF";

type Props = PropsWithChildren<{ toolName: string }>;

export function ToolLayout({ toolName, children }: Props) {
  return (
    <div className="min-h-screen" style={{ background: BEIGE }}>
      <nav
        className="sticky top-0 z-[100] flex items-center justify-between gap-4 border-b border-black/10 px-4 py-3 sm:px-8"
        style={{ background: BEIGE }}
      >
        <Link
          href="/herramientas"
          className="shrink-0 border-[1.5px] border-black/30 px-3 py-1.5 text-[0.65rem] font-extrabold uppercase tracking-[0.16em] text-[#111] transition-colors hover:border-[#FF6FAF] hover:text-[#FF6FAF]"
        >
          ← Volver
        </Link>
        <div className="flex min-w-0 items-center gap-1 overflow-hidden text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#111]/70">
          <Link href="/" className="shrink-0 text-[#111]/30 hover:text-[#111]">
            Inicio
          </Link>
          <span className="text-[#111]/20">/</span>
          <Link href="/herramientas" className="shrink-0 text-[#111]/30 hover:text-[#111]">
            Herramientas
          </Link>
          <span className="text-[#111]/20">/</span>
          <span className="truncate text-[#111]/90">{toolName}</span>
        </div>
        <span className="hidden shrink-0 font-accent text-sm text-[#FF6FAF] sm:block">Las Girls+</span>
      </nav>
      {children}
    </div>
  );
}

export const TOOL_THEME = { BEIGE, INK, PINK };
