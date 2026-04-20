"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TICK_MS = 1350;

const FRAMES = [
  { src: "/LASGIRLSS/STIKER-004.png" as const, width: 1435, height: 2192 },
  { src: "/LASGIRLSS/STIKER-001.png" as const, width: 962, height: 1715 },
] as const;

/**
 * Sizing: on mobile we cap the figure to ~46dvh so the copy (headline,
 * marquee, CTAs) fits in the same viewport. From md+ we keep the full
 * 100dvh column like the original design.
 */
const STICKER_SIZE_CLASS =
  "h-[46dvh] min-h-[46dvh] md:h-[100dvh] md:min-h-[100dvh] w-auto max-w-[min(100vw,100%)] max-md:max-w-[100vw]";

type Props = {
  className?: string;
};

export function HeroStickerMotion({ className = "" }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FRAMES.length);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`hero-sticker-motion pointer-events-none relative min-h-[46dvh] w-full overflow-visible md:min-h-[100dvh] ${className}`}
      aria-hidden
    >
      {FRAMES.map((frame, index) => {
        const isActive = index === activeIndex;

        return (
          <Image
            key={frame.src}
            src={frame.src}
            alt=""
            width={frame.width}
            height={frame.height}
            sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, min(1600px, 42vw)"
            priority={index === 0}
            className={[
              "absolute bottom-0 left-1/2 -translate-x-1/2",
              "object-contain object-bottom md:left-0 md:translate-x-0 md:object-left",
              "drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)]",
              "origin-bottom md:origin-bottom-left",
              "transition-[opacity,transform] duration-500 ease-out",
              STICKER_SIZE_CLASS,
              isActive ? "z-[2] opacity-100 rotate-0" : "z-[1] opacity-0 -rotate-[1.75deg]",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
