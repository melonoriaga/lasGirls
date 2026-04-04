"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TICK_MS = 1350;

const FRAMES = [
  {
    src: "/LASGIRLSS/STIKER-004.png" as const,
    width: 1435,
    height: 2192,
    heightClass: "h-[100dvh]",
    mobileTranslateX: "-50%",
    desktopTranslateX: "0%",
    translateY: "0%",
    scale: 1,
    zIndex: 2,
  },
  {
    src: "/LASGIRLSS/STIKER-001.png" as const,
    width: 962,
    height: 1715,
    heightClass: "h-[115dvh]",
    mobileTranslateX: "-50%",
    desktopTranslateX: "0%",
    translateY: "0%",
    scale: 1,
    zIndex: 1,
  },
] as const;

type Props = {
  className?: string;
};

export function HeroStickerMotion({ className = "" }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");

    const handleChange = () => {
      setIsDesktop(media.matches);
    };

    handleChange();

    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", handleChange);
      return () => media.removeEventListener("change", handleChange);
    }

    media.addListener(handleChange);
    return () => media.removeListener(handleChange);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FRAMES.length);
    }, TICK_MS);

    return () => window.clearInterval(id);
  }, []);

  return (
    <div
      className={`hero-sticker-motion pointer-events-none relative min-h-[100dvh] w-full overflow-visible ${className}`}
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
            sizes="(max-width: 767px) 200vw, min(1600px, 100vw)"
            priority={index === 0}
            className={[
              "absolute bottom-0 left-1/2 w-auto max-w-none object-contain object-bottom object-center",
              "drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)]",
              "transition-opacity duration-500 ease-out",
              "md:left-0 md:object-left",
              frame.heightClass,
              isActive ? "opacity-100" : "opacity-0",
            ].join(" ")}
            style={{
              zIndex: frame.zIndex,
              transform: isDesktop
                ? `translate(${frame.desktopTranslateX}, ${frame.translateY}) scale(${frame.scale})`
                : `translate(${frame.mobileTranslateX}, ${frame.translateY}) scale(${frame.scale})`,
              transformOrigin: isDesktop ? "bottom left" : "bottom center",
              willChange: "opacity, transform",
            }}
          />
        );
      })}
    </div>
  );
}
