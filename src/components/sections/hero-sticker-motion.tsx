"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TICK_MS = 1350;

const FRAMES = [
  { src: "/LASGIRLSS/STIKER-004.png" as const, width: 1435, height: 2192 },
  { src: "/LASGIRLSS/STIKER-001.png" as const, width: 962, height: 1715 },
] as const;

/**
 * Two presets:
 * - `hero` (desktop default): lanyard-size column (100dvh on md+).
 * - `inline` (mobile inline): compact portrait sandwiched between copy and CTAs.
 */
const VARIANTS = {
  hero: {
    wrapper:
      "h-full min-h-[42dvh] max-h-[42dvh] md:h-auto md:min-h-[100dvh] md:max-h-none",
    image:
      "h-[42dvh] min-h-[42dvh] md:h-[100dvh] md:min-h-[100dvh] w-auto max-w-[min(100vw,100%)] max-md:max-w-[100vw]",
    imgPosition: "md:left-0 md:translate-x-0 md:object-left",
    origin: "md:origin-bottom-left",
  },
  inline: {
    wrapper: "h-[46dvh] min-h-[46dvh] max-h-[46dvh]",
    image: "h-[46dvh] min-h-[46dvh] w-auto max-w-full",
    imgPosition: "",
    origin: "",
  },
} as const;

type Variant = keyof typeof VARIANTS;

type Props = {
  className?: string;
  variant?: Variant;
};

export function HeroStickerMotion({ className = "", variant = "hero" }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const v = VARIANTS[variant];

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FRAMES.length);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`hero-sticker-motion pointer-events-none relative w-full overflow-visible ${v.wrapper} ${className}`}
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
            sizes="(max-width: 767px) 70vw, (max-width: 1279px) 50vw, min(1600px, 42vw)"
            priority={index === 0}
            className={[
              "absolute bottom-0 left-1/2 -translate-x-1/2",
              "object-contain object-bottom",
              v.imgPosition,
              "drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)]",
              "origin-bottom",
              v.origin,
              "transition-[opacity,transform] duration-500 ease-out",
              v.image,
              isActive ? "z-[2] opacity-100 rotate-0" : "z-[1] opacity-0 -rotate-[1.75deg]",
            ].join(" ")}
          />
        );
      })}
    </div>
  );
}
