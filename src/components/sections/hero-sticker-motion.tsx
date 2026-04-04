"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const FRAMES = ["/LASGIRLSS/STIKER-004.png", "/LASGIRLSS/STIKER-001.png"];

const TICK_MS = 1350;

type Props = {
  /**
   * Contenedor con altura definida. Misma caja para todos los frames → misma escala y ancla;
   * solo cambia el PNG (sin transform extra) para que el layout no “salte” entre slides.
   */
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
      className={`hero-sticker-motion pointer-events-none relative z-[11] flex h-full min-h-0 w-full items-end justify-center md:justify-start ${className}`}
      aria-hidden
    >
      <div className="relative flex h-full min-h-0 w-auto max-w-full items-end">
        <Image
          src={FRAMES[i]}
          alt=""
          width={1200}
          height={1500}
          sizes="(max-width: 767px) 90vw, 42vw"
          priority
          className="h-full max-h-full w-auto max-w-full object-contain object-bottom object-center drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)] md:object-left"
        />
      </div>
    </div>
  );
}
