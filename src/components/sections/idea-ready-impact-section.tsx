"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import CurvedLoop from "@/components/CurvedLoop";

gsap.registerPlugin(ScrollTrigger);

/** Full-viewport “your idea, ready today” poster block (headline + callout + sticker). */
export function IdeaReadyImpactSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

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

      const charInner = el.querySelector<HTMLElement>(".impact-char-float");
      if (charInner) {
        gsap.to(charInner, {
          keyframes: [
            { y: -26, rotate: 4, duration: 2.6, ease: "sine.inOut" },
            { y: 12, rotate: -3, duration: 2.6, ease: "sine.inOut" },
            { y: 0, rotate: 0, duration: 2.2, ease: "sine.inOut" },
          ],
          repeat: -1,
        });
      }
    }, el);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="impact-poster"
      ref={sectionRef}
      className="relative isolate flex h-[100dvh]  overflow-hidden  bg-black  items-center justify-center"
    >
      <div className="impact-fade relative h-[78%] w-[88%] rounded-[1.75rem] bg-[#f5a8cc] px-5 py-5 sm:h-[72%] sm:w-[84%] sm:px-10 sm:py-10 lg:h-[70%] lg:w-[80%] lg:rounded-[2.5rem] lg:px-16 lg:py-14">
        <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-black/65 md:text-[11px] mb-4">02 - Idea Ready Impact</p>

        <div className="pointer-events-none absolute inset-0 z-[1] flex items-center justify-center opacity-90 overflow-hidden">
          <CurvedLoop
            marqueeText="TU IDEA LISTA HOY ✦ "
            speed={1.2}
            curveAmount={260}
            interactive={false}
            fill="#FC92C1"
            className="font-display font-black"
          />
        </div>

        <div className="relative z-[6]">
          <h2 className="font-display text-[clamp(2.4rem,11vw,14rem)] uppercase leading-[0.85] tracking-[-0.03em] text-black">
            TU IDEA
          </h2>

          <h2
            className="impact-line font-accent -mt-6 text-[clamp(2.2rem,12vw,10rem)] leading-[0.8] text-[#FF6FAF] -rotate-[6deg] translate-x-[10px] translate-y-[-6px] [-webkit-text-stroke:6px_white] [paint-order:stroke_fill] sm:-mt-10 sm:translate-x-[50px] sm:translate-y-[-14px] sm:[-webkit-text-stroke:12px_white] lg:translate-x-[120px] lg:translate-y-[-24px] lg:[-webkit-text-stroke:26px_white]"
          >
            Lista hoy
          </h2>
        </div>

        <div className="impact-fade absolute bottom-4 left-4 z-[10] max-w-[calc(100%-2rem)] sm:bottom-10 sm:left-10 sm:max-w-none lg:bottom-14 lg:left-16">
          <div
            className="max-w-[240px] rounded-xl border border-black bg-[#FF6FAF] px-3 py-2.5 backdrop-blur-sm sm:max-w-[340px] sm:px-4 sm:py-3 lg:max-w-[420px] lg:px-5 lg:py-4"
            style={{ borderStyle: "dashed", borderWidth: "3px" }}
          >
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-black sm:text-[0.62rem] lg:text-[0.7rem]">
              SIN VUELTAS
            </p>

            <p className="mt-1 font-accent text-[0.9rem] italic text-white sm:text-[1rem] lg:text-[1.15rem]">
              No necesitas meses y meses de reuniones.
            </p>

            <p className="mt-1.5 text-[0.7rem] font-semibold uppercase leading-snug tracking-[0.15em] text-black/95 sm:text-[0.8rem] lg:text-[1rem]">
              Si ya tenés marca, textos e imágenes, lo bajamos a tierra rápido y con criterio.
            </p>
          </div>
        </div>

        <div className="impact-char-wrap pointer-events-none absolute -bottom-2 right-0 z-[8] h-full w-[48%] max-w-[760px] sm:-bottom-4 sm:right-[-100px] sm:w-[58%] lg:h-[110%] lg:w-[55%]">
          <div className="impact-char-float impact-fade relative h-full w-full" style={{ transformOrigin: "50% 100%" }}>
            <Image
              src="/brand/stickers/STICKER19.png"
              alt="Sticker Las Girls+"
              fill
              className="object-contain object-bottom"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
