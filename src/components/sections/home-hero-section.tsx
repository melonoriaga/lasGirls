"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import { HeroBrandMarquee } from "@/components/sections/hero-brand-marquee";
import { HeroStickerMotion } from "@/components/sections/hero-sticker-motion";

gsap.registerPlugin(ScrollTrigger);

export function HomeHeroSection() {
  const scopeRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!scopeRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-main-line",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.11 },
      );

      gsap.fromTo(
        ".hero-floating-sticker",
        { autoAlpha: 0, scale: 0.7, rotate: -25 },
        { autoAlpha: 1, scale: 1, rotate: 0, duration: 0.9, ease: "back.out(1.7)", delay: 0.35 },
      );

      gsap.fromTo(
        ".hero-soft-line",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.62, ease: "power2.out", delay: 0.42, stagger: 0.08 },
      );
    }, scopeRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="hero"
      ref={scopeRef}
      className="relative isolate flex min-h-[100dvh] flex-col overflow-x-hidden border-y-2 border-black bg-[#f4ede6]"
    >
      <div className="absolute inset-0 z-0">
        <Aurora
          colorStops={["#F8BBD0", "#FF6FAF", "#F882C2", "#D34291"]}
          amplitude={1}
          blend={0.5}
          speed={1}
        />
      </div>

      <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-multiply" />

      <div className="hero-split relative z-10 flex min-h-0 flex-1 flex-col items-center justify-center px-4 pb-10 pt-0 sm:px-5 md:px-6 md:pb-12 lg:px-10">
        <div className="hero-split__stage mx-auto w-full max-w-full md:max-w-[min(1600px,100%)]">
          <div className="grid grid-cols-1 items-stretch gap-y-8 sm:gap-y-10 md:grid-cols-[minmax(10rem,1fr)_min(54vw,36rem)] md:gap-x-5 lg:grid-cols-[minmax(12rem,1fr)_min(56vw,40rem)] lg:gap-x-7 xl:grid-cols-[minmax(14rem,1fr)_58vw] xl:gap-x-10">
            <div className="hero-split__figure-area relative z-0 flex w-full min-h-[min(100svh,100dvh)] min-w-0 flex-col items-center justify-end md:min-h-[100dvh] md:w-full md:shrink-0 md:items-end md:justify-end">
              <div className="relative z-0 mx-auto w-full min-w-0 md:mx-0 md:max-w-none">
                <HeroStickerMotion />
              </div>
            </div>

            <div className="hero-split__copy-area relative z-30 mx-auto flex w-full max-w-full min-w-0 flex-col items-start justify-center self-center pt-[max(4.25rem,env(safe-area-inset-top,0px)+3.25rem)] text-left md:w-auto md:max-w-none md:shrink-0 md:self-center md:pt-20 md:pl-1 lg:pt-24 lg:pl-2">
              <HeroBrandMarquee />

              <h1
                className="hero-main-line mt-6 w-full font-display font-black uppercase leading-[1] tracking-[-0.015em] text-black md:mt-8
                  text-[clamp(4.3rem,12.3vw,6rem)]
                  md:max-w-none md:text-[clamp(4.9rem,10.5vw,7rem)]
                  lg:text-[clamp(5.4rem,10.8vw,7.9rem)]"
              >
                <span className="block">SOLUCIONES DIGITALES</span>
              </h1>

              <p
                className="hero-soft-line mt-4 font-accent font-medium leading-[1.05] text-black
                  text-[clamp(2.7rem,6.2vw,3.9rem)]
                  sm:text-[clamp(2.8rem,5.8vw,4.2rem)]
                  md:text-[clamp(2rem,5vw,3rem)]
                  lg:text-[clamp(3rem,3vw,4rem)]"
              >
                Mandale cumbia visual
              </p>

              <div className="hero-soft-line mt-8 h-[3px] w-full max-w-full bg-black md:max-w-[52ch]" />
              <div className="hero-soft-line mt-5 w-full mr-10 text-base font-regular normal-case leading-snug tracking-wide text-black/85 lg:text-lg">
                <p>
                  Las girls 💖🧉 somos software, brand y product factory;
                  <br />
                  junto a nuestro team diseñamos, construimos y lanzamos productos digitales completos
                  <br />
                  de la idea a algo que funciona—: branding, UX/UI, desarrollo, sistemas y contenido, todo conectado.
                  <br />
                  No somos una agencia más: nos metemos con vos en el proceso y te acompañamos para convertir tu idea en algo real.
                </p>
              </div>

              <div className="hero-soft-line relative z-20 mt-7 flex flex-wrap items-center justify-start gap-3">
                <Link href="#contacto" className="hero-cta hero-cta--dark">
                  HABLEMOS DE TU IDEA
                </Link>
                <Link href="#servicios" className="hero-cta hero-cta--light">
                  VER CÓMO TRABAJAMOS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-floating-sticker pointer-events-none absolute right-4 top-20 z-[12] hidden lg:block xl:right-8 xl:top-24">
        <div className="hero-floating-sticker__inner">
          <Image
            src="/brand/stickers/sticker-6.png"
            alt=""
            width={260}
            height={260}
            priority
            className="h-auto w-[180px] xl:w-[230px] 2xl:w-[260px] drop-shadow-[0_18px_30px_rgba(211,66,145,0.25)]"
          />
        </div>
      </div>
    </section>
  );
}
