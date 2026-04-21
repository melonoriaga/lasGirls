"use client";

import type { PropsWithChildren } from "react";

const BEIGE = "#F4EDE6";
const INK = "#111111";
const PINK = "#FF6FAF";

type Props = PropsWithChildren<{ toolName: string }>;

export function ToolLayout({ toolName, children }: Props) {
  void toolName;
  return (
    <div className="min-h-screen pt-16 sm:pt-20" style={{ background: BEIGE }}>
      {children}
    </div>
  );
}

export const TOOL_THEME = { BEIGE, INK, PINK };
