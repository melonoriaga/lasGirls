"use client";

import { useEffect, useRef } from "react";

type Props = {
  className?: string;
};

export function LiquidEtherBg({ className }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const onMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 100;
      const y = ((event.clientY - rect.top) / rect.height) * 100;
      element.style.setProperty("--mx", `${x}%`);
      element.style.setProperty("--my", `${y}%`);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  return (
    <div ref={ref} className={`liquid-ether ${className ?? ""}`}>
      <div className="liquid-ether__blob liquid-ether__blob--a" />
      <div className="liquid-ether__blob liquid-ether__blob--b" />
      <div className="liquid-ether__blob liquid-ether__blob--c" />
      <div className="liquid-ether__grain" />
    </div>
  );
}
