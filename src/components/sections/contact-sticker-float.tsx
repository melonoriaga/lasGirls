"use client";

import Image from "next/image";
import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  className?: string;
};

export function ContactStickerFloat({ className = "" }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const revealRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const root = rootRef.current;
    const reveal = revealRef.current;
    if (!root || !reveal) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        reveal,
        { y: 52, opacity: 0, rotateZ: -4 },
        {
          y: 0,
          opacity: 1,
          rotateZ: 0,
          duration: 1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: root,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
          onComplete: () => {
            reveal.querySelector(".contact-sticker-float-inner")?.classList.add("contact-sticker-float-inner--animate");
          },
          onReverseComplete: () => {
            reveal.querySelector(".contact-sticker-float-inner")?.classList.remove("contact-sticker-float-inner--animate");
          },
        },
      );
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative flex justify-center lg:sticky lg:top-28 lg:justify-end ${className}`}
    >
      <div ref={revealRef} className="relative will-change-transform">
        <div className="contact-sticker-float-inner relative">
          <Image
            src="/brand/stickers/STICKER17.png"
            alt=""
            width={440}
            height={440}
            sizes="(max-width:1023px) 240px, 320px"
            className="h-auto w-[min(70vw,240px)] select-none drop-shadow-[0_22px_42px_rgba(17,17,17,0.38)] lg:w-[min(320px,24vw)]"
          />
        </div>
      </div>
    </div>
  );
}
