"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";

gsap.registerPlugin(ScrollTrigger);

const STICKER_POSES = [
  { x: 0, y: 0, r: 0 },
  { x: -18, y: -10, r: -6 },
  { x: 14, y: -16, r: 8 },
  { x: -10, y: 12, r: -9 },
  { x: 22, y: 8, r: 7 },
];

/** Full-viewport “your idea, ready today” poster block (headline + callout + sticker). */
export function IdeaReadyImpactSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [poseIndex, setPoseIndex] = useState(0);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        "#impact-poster .impact-line",
        { autoAlpha: 0, y: 42 },
        {
          autoAlpha: 1,
          y: 0,
          stagger: 0.12,
          duration: 0.8,
          ease: "power3.out",
          scrollTrigger: {
            trigger: el,
            start: "top 72%",
          },
        },
      );

      gsap.fromTo(
        "#impact-poster .impact-fade",
        { autoAlpha: 0, y: 24, scale: 0.96 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          stagger: 0.08,
          duration: 0.72,
          ease: "power2.out",
          scrollTrigger: {
            trigger: el,
            start: "top 68%",
          },
        },
      );

      gsap.to("#impact-poster .impact-char-wrap", {
        yPercent: -10,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: 0.9,
        },
      });
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="impact-poster"
      ref={sectionRef}
      className="relative isolate flex h-[100dvh] items-center justify-center overflow-hidden border-t-2 border-black bg-black px-4 py-6 lg:px-8 lg:py-8"
    >
      <div className="impact-fade relative h-full w-full max-w-[1200px] overflow-hidden rounded-[2.5rem] bg-[#f5a8cc] px-8 py-8 lg:rounded-[3rem] lg:px-12 lg:py-10">
        <div className="relative z-[6]">
          <h2 className="impact-line impact-line--top font-display text-[clamp(3.5rem,11vw,9rem)] uppercase leading-[0.85] tracking-[-0.03em] text-black">
            TU IDEA
          </h2>
          <h2
            className="impact-line font-accent -mt-1 text-[clamp(3rem,10vw,8rem)] leading-[0.9] text-[#ff2f9d]"
            style={{ WebkitTextStroke: "5px white", paintOrder: "stroke fill" }}
          >
            Lista hoy
          </h2>
        </div>

        <div className="impact-fade absolute bottom-8 left-8 z-[10] lg:bottom-10 lg:left-12">
          <div className="max-w-[280px] rounded-xl border border-black/30 bg-[#f5a8cc]/60 px-4 py-3 backdrop-blur-sm">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-black">SIN VUELTAS</p>
            <p className="mt-1 font-accent text-[1rem] italic text-black line-through">
              No necesitas seis meses de reuniones.
            </p>
            <p className="mt-1.5 text-[0.6rem] font-semibold uppercase leading-snug tracking-[0.1em] text-black/90">
              SI YA TENES MARCA, TEXTOS E IMAGENES, LO BAJAMOS A TIERRA RAPIDO Y CON CRITERIO.
            </p>
          </div>
        </div>

        <div
          className="impact-char-wrap impact-fade absolute bottom-0 right-0 z-[8] h-[90%] w-[48%] max-w-[560px]"
          onMouseEnter={() => setPoseIndex((i) => (i + 1) % STICKER_POSES.length)}
          style={{
            transform: `translate(${STICKER_POSES[poseIndex].x}px, ${STICKER_POSES[poseIndex].y}px) rotate(${STICKER_POSES[poseIndex].r}deg)`,
          }}
        >
          <Image
            src="/brand/stickers/STICKER19.png"
            alt="Sticker Las Girls+"
            fill
            className="object-contain object-bottom"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}
