"use client";

import { useLayoutEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function ContactDecorationSticker() {
  const wrapRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const el = wrapRef.current;
    if (!el) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { autoAlpha: 0.9, y: 0, rotation: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(el, { autoAlpha: 0, y: 64, rotation: 4 });
      gsap.to(el, {
        autoAlpha: 0.9,
        y: 0,
        rotation: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: el,
          start: "top 92%",
          toggleActions: "play none none none",
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={wrapRef}
      className="absolute -bottom-8 right-0 h-[48vh] w-[46vw] min-w-[300px] max-w-[560px] md:bottom-0 md:right-4"
      aria-hidden
    >
      <Image
        src="/brand/stickers/STICKER17.png"
        alt=""
        fill
        className="object-contain object-bottom-right drop-shadow-[6px_14px_0_rgba(17,17,17,0.08)]"
        sizes="(max-width: 768px) 90vw, 42vw"
      />
    </div>
  );
}
