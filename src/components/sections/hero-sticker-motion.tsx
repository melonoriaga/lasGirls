"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FRAMES = ["/LASGIRLSS/STIKER-004.png", "/LASGIRLSS/STIKER-001.png"];

const TICK_MS = 1350;

type Props = {
  className?: string;
};

export function HeroStickerMotion({ className = "" }: Props) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), TICK_MS);
    return () => window.clearInterval(id);
  }, []);

  const i = tick % 2;

  return (
    <div
      className={`hero-sticker-motion pointer-events-none relative z-[11] flex min-h-[100dvh] w-full items-end justify-center overflow-visible md:justify-start ${className}`}
      aria-hidden
    >
      <Image
        src={FRAMES[i]}
        alt=""
        width={1800}
        height={2000}
        sizes="(max-width: 767px) 100vw, min(90vw, 1200px)"
        priority
        className="h-[100dvh] min-h-[100dvh] w-auto max-w-none shrink-0 object-contain object-bottom drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)] md:object-left"
      />
    </div>
  );
}
