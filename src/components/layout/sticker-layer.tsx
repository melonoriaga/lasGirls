"use client";

import Image from "next/image";
import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const stickers = [
  { src: "/brand/stickers/sticker-1.png", cls: "top-[15vh] left-[2vw] w-16 md:w-24", speed: 80 },
  { src: "/brand/stickers/STICKER2.png", cls: "top-[35vh] right-[3vw] w-20 md:w-28", speed: -90 },
  { src: "/brand/stickers/STICKER4.png", cls: "top-[72vh] left-[5vw] w-16 md:w-24", speed: 70 },
  { src: "/brand/stickers/STICKER5.png", cls: "top-[58vh] right-[6vw] w-20 md:w-30", speed: -75 },
];

export function StickerLayer() {
  useEffect(() => {
    const elements = gsap.utils.toArray<HTMLElement>(".sticker-float");

    elements.forEach((element) => {
      const speed = Number(element.dataset.speed || 60);
      gsap.to(element, {
        y: speed,
        rotate: speed > 0 ? 9 : -9,
        ease: "none",
        scrollTrigger: {
          trigger: document.body,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      const onEnter = () => gsap.to(element, { scale: 1.16, duration: 0.25, rotate: "+=8" });
      const onLeave = () => gsap.to(element, { scale: 1, duration: 0.25 });
      element.addEventListener("mouseenter", onEnter);
      element.addEventListener("mouseleave", onLeave);
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-[5] hidden md:block">
      {stickers.map((sticker) => (
        <div
          key={sticker.src}
          className={`sticker-float pointer-events-auto absolute ${sticker.cls}`}
          data-speed={sticker.speed}
        >
          <Image src={sticker.src} alt="" aria-hidden width={140} height={140} className="h-auto w-full" />
        </div>
      ))}
    </div>
  );
}
