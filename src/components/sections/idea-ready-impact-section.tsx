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
      <div className="impact-fade relative h-[70%] w-[80%]  rounded-[1.75rem] bg-[#f5a8cc] px-6 py-6 sm:px-10 sm:py-10
      lg:rounded-[2.5rem] lg:px-16 lg:py-14">
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
          <h2 className="font-display text-[clamp(4rem,13vw,14rem)] uppercase leading-[0.85] tracking-[-0.03em] text-black">
            TU IDEA
          </h2>

          <h2
            className="impact-line font-accent -mt-10 text-[clamp(3.5rem,12vw,10rem)] leading-[0.8] text-[#FF6FAF]"
            style={{ WebkitTextStroke: "26px white", paintOrder: "stroke fill", transform: "rotate(-6deg) translateX(120px) translateY(-24px)" }}
          >
            Lista hoy
          </h2>
        </div>

        <div className="impact-fade absolute bottom-6 left-6 z-[10] sm:bottom-10 sm:left-10 lg:bottom-14 lg:left-16">
          <div
            className="max-w-[340px] rounded-xl border border-black bg-[#FF6FAF] px-4 py-3 backdrop-blur-sm
            lg:max-w-[420px] lg:px-5 lg:py-4"
            style={{ borderStyle: "dashed", borderWidth: "3px" }}
          >
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-black lg:text-[0.7rem]">
              SIN VUELTAS
            </p>

            <p className="mt-1 font-accent text-[1rem] italic text-white lg:text-[1.15rem]">
              No necesitas meses y meses de reuniones.
            </p>

            <p className="mt-1.5 text-[0.8rem] font-semibold uppercase leading-snug tracking-[0.15em] text-black/95 lg:text-[1rem]">
              Si ya tenés marca, textos e imágenes, lo bajamos a tierra rápido y con criterio.
            </p>
          </div>
        </div>

        <div className="impact-char-wrap absolute -bottom-2 right-0 z-[8] h-full w-[58%] max-w-[760px] sm:-bottom-4 sm:right-[-100px] lg:h-[110%] lg:w-[55%]">
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
