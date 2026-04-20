"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import Aurora from "@/components/Aurora";
import { RotatingText } from "@/components/RotatingText";
import { HeroBrandMarquee } from "@/components/sections/hero-brand-marquee";
import { HeroStickerMotion } from "@/components/sections/hero-sticker-motion";

gsap.registerPlugin(ScrollTrigger);

export function HomeHeroSection() {
  const scopeRef = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (!scopeRef.current) return;

    let revertMatchMedia: (() => void) | undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-main-line",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.11 },
      );

      gsap.fromTo(
        ".hero-floating-sticker",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.6, delay: 0.35, ease: "power2.out" },
      );

      const inner = scopeRef.current?.querySelector<HTMLElement>(".hero-floating-sticker__inner");
      if (inner) {
        const tl = gsap.timeline({ delay: 0.35 });

        tl.fromTo(
          inner,
          { scale: 0.6, rotate: -25, y: 0 },
          { scale: 1, rotate: 0, duration: 0.9, ease: "back.out(1.8)" },
        );

        tl.to(inner, {
          keyframes: [
            { y: -22, rotate: 6, duration: 2.4, ease: "sine.inOut" },
            { y: 8, rotate: -5, duration: 2.4, ease: "sine.inOut" },
            { y: 0, rotate: 0, duration: 2.0, ease: "sine.inOut" },
          ],
          repeat: -1,
        });
      }

      gsap.fromTo(
        ".hero-soft-line",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.62, ease: "power2.out", delay: 0.42, stagger: 0.08 },
      );

      const section = scopeRef.current;
      const cta = section?.querySelector<HTMLElement>(".hero-cta-morph");
      const curtain = section?.querySelector<HTMLElement>(".hero-curtain");
      if (section && cta && curtain) {
        const baseline = {
          dx: 0,
          dy: 0,
        };
        const translateFactor = 0.85;

        /** First ~deadRatio of pinned scroll: hold CTA + curtain still so the button can be read. */
        const pinCfg = (isMobile: boolean) =>
          ({
            deadRatio: isMobile ? 0.26 : 0.08,
            /** Shorter pin on mobile → next section arrives sooner after the zoom. */
            endDistance: isMobile ? "+=52%" : "+=82%",
          }) as const;

        /** Reset transforms and sync curtain origin to the black CTA's real viewport center. */
        const measure = () => {
          gsap.set(cta, { clearProps: "x,y,scale,borderRadius" });
          const vw = window.innerWidth;
          const vh = window.innerHeight;
          const rect = cta.getBoundingClientRect();
          const cx = rect.left + rect.width / 2;
          const cy = rect.top + rect.height / 2;
          baseline.dx = vw / 2 - cx;
          baseline.dy = vh / 2 - cy;
          gsap.set(curtain, {
            clipPath: `circle(0% at ${(cx / vw) * 100}% ${(cy / vh) * 100}%)`,
            opacity: 1,
          });
        };

        const toggleHeroContents = (hide: boolean) => {
          const kids = Array.from(section.children) as HTMLElement[];
          kids.forEach((el) => {
            if (el.classList.contains("hero-curtain")) return;
            el.style.visibility = hide ? "hidden" : "";
          });
        };

        const mapAnimProgress = (raw: number, dead: number) =>
          raw <= dead ? 0 : (raw - dead) / (1 - dead);

        const createHeroPinSt = (isMobile: boolean) => {
          const { deadRatio, endDistance } = pinCfg(isMobile);

          return ScrollTrigger.create({
            trigger: section,
            start: "bottom bottom",
            end: endDistance,
            pin: true,
            pinSpacing: true,
            scrub: 0.55,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onRefresh: measure,
            onUpdate: (self) => {
              const tRaw = self.progress;
              const tAnim = mapAnimProgress(tRaw, deadRatio);
              const eased = tAnim * tAnim;
              const scale = 1 + eased * 4;

              gsap.set(cta, {
                x: baseline.dx * tAnim * translateFactor,
                y: baseline.dy * tAnim * translateFactor,
                scale,
                force3D: true,
              });

              const label = cta.querySelector<HTMLElement>(".hero-cta-morph__label");
              if (label) {
                label.style.opacity = `${Math.max(0, 1 - tAnim * 2.2)}`;
              }

              const vw = window.innerWidth;
              const vh = window.innerHeight;
              const rect = cta.getBoundingClientRect();
              const curtainCx = ((rect.left + rect.width / 2) / vw) * 100;
              const curtainCy = ((rect.top + rect.height / 2) / vh) * 100;
              const radius = Math.min(160, tAnim * 160);
              gsap.set(curtain, {
                clipPath: `circle(${radius}% at ${curtainCx}% ${curtainCy}%)`,
              });
            },
            onLeave: () => toggleHeroContents(true),
            onEnterBack: () => toggleHeroContents(false),
          });
        };

        const mm = gsap.matchMedia();
        revertMatchMedia = () => mm.revert();
        mm.add("(max-width: 767px)", () => {
          const st = createHeroPinSt(true);
          return () => st.kill();
        });
        mm.add("(min-width: 768px)", () => {
          const st = createHeroPinSt(false);
          return () => st.kill();
        });

        gsap.to(curtain, {
          opacity: 0,
          ease: "none",
          scrollTrigger: {
            trigger: "#impact-poster",
            start: "top bottom",
            end: "top top",
            scrub: 0.3,
            invalidateOnRefresh: true,
          },
        });
      }
    }, scopeRef);

    return () => {
      revertMatchMedia?.();
      ctx.revert();
    };
  }, []);

  return (
    <section
      id="hero"
      ref={scopeRef}
      className="relative isolate overflow-x-hidden border-y-2 border-black bg-[#f4ede6] md:flex md:min-h-[100dvh] md:flex-col"
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

      <div className="hero-split relative z-10 w-full px-4 pt-[max(5.5rem,env(safe-area-inset-top,0px)+4.5rem)] pb-12 sm:px-5 md:flex md:min-h-0 md:flex-1 md:flex-col md:items-center md:justify-center md:px-6 md:pt-0 md:pb-12 lg:px-10">
        <div className="hero-split__stage mx-auto w-full max-w-full md:max-w-[min(1600px,100%)]">
          <div className="grid grid-cols-1 items-stretch gap-y-8 sm:gap-y-10 md:grid-cols-[minmax(10rem,1fr)_min(54vw,36rem)] md:gap-x-5 lg:grid-cols-[minmax(12rem,1fr)_min(56vw,40rem)] lg:gap-x-7 xl:grid-cols-[minmax(14rem,1fr)_58vw] xl:gap-x-10">
            <div className="hero-split__figure-area relative z-0 hidden w-full min-h-[100dvh] min-w-0 flex-col items-end justify-end md:flex md:w-full md:shrink-0">
              <div className="relative z-0 mx-auto w-full min-w-0 md:mx-0 md:max-w-none">
                <HeroStickerMotion />
              </div>
            </div>

            <div className="hero-split__copy-area relative z-30 flex w-full max-w-full min-w-0 flex-col items-start text-left md:mx-auto md:w-auto md:max-w-none md:shrink-0 md:justify-center md:self-center md:pt-20 md:pl-1 lg:pt-24 lg:pl-2">
              <HeroBrandMarquee />

              <h1
                className="hero-main-line mt-6 w-full font-display font-black uppercase leading-[1] tracking-[-0.015em] text-black md:mt-8
                  text-[clamp(4rem,12vw,6.5rem)]
                  sm:text-[clamp(4rem,12vw,6rem)]
                  md:max-w-none md:text-[clamp(4.9rem,10.5vw,7rem)]
                  lg:text-[clamp(5.4rem,10.8vw,7.9rem)]"
              >
                <span className="block">SOLUCIONES DIGITALES</span>
                <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 leading-[1] md:gap-x-4">
                  <span>QUE</span>
                  <RotatingText
                    texts={["FUNCIONAN", "VENDEN", "ESCALAN"]}
                    mainClassName="inline-flex items-center overflow-hidden rounded-2xl bg-[#ff3ea5] px-3 py-1.5 text-white sm:px-5 sm:py-2 md:px-7 md:py-3"
                    staggerFrom="last"
                    staggerDuration={0.025}
                    rotationInterval={2200}
                    transition={{ type: "spring", damping: 30, stiffness: 380 }}
                  />
                </span>
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

              <div className="hero-soft-line mt-6 flex w-full justify-center md:hidden">
                <div className="relative w-[70vw] max-w-[320px]">
                  <HeroStickerMotion variant="inline" />
                </div>
              </div>

              <div className="hero-soft-line relative z-20 mt-6 flex w-full flex-col items-stretch gap-3 md:mt-7 md:flex-row md:flex-wrap md:items-center md:justify-start md:gap-3">
                <Link
                  href="#contacto"
                  className="hero-cta hero-cta--dark hero-cta-morph flex w-full shrink-0 justify-center md:inline-flex md:w-auto"
                >
                  <span className="hero-cta-morph__label">HABLEMOS DE TU IDEA</span>
                </Link>
                <Link
                  href="#servicios"
                  className="hero-cta hero-cta--light flex w-full shrink-0 justify-center md:inline-flex md:w-auto"
                >
                  VER CÓMO TRABAJAMOS
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="hero-curtain" aria-hidden="true" />
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
