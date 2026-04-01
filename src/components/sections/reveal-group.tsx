"use client";

import type { PropsWithChildren } from "react";
import { useGsapReveal } from "@/hooks/useGsapReveal";

type Props = PropsWithChildren<{
  className?: string;
  itemClassName?: string;
}>;

export function RevealGroup({ children, className }: Props) {
  useGsapReveal(".reveal-item");
  return <div className={className}>{children}</div>;
}
