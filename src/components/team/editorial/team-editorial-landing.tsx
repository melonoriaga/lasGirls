"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { FounderCollage } from "@/components/team/editorial/founder-collage";
import { TeamSetupEditorialGrid } from "@/components/team/editorial/team-setup-editorial-grid";
import { useDictionary } from "@/i18n/locale-provider";

const PAPER_BG = "bg-[#f4ede6]";
const bleed =
  "w-full min-w-0 max-w-[100vw] px-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-[clamp(1.25rem,5vw,4rem)]";
const HERO_BODY =
  "max-w-3xl whitespace-pre-line text-[1rem] leading-[1.72] text-black/88 md:text-[1.09rem]";

function GrainOverlay() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat"
    />
  );
}

export function TeamEditorialLanding() {
  const tl = useDictionary().teamLanding;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return undefined;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return undefined;

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<Element>(root.querySelectorAll(".team-rise")).forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 24 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            delay: Math.min(i * 0.03, 0.42),
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        );
      });
    }, rootRef);

    return () => ctx.revert();
  }, []);

  return (
    <article ref={rootRef} className={`relative w-full overflow-x-clip border-y-2 border-black text-black sm:border-x ${PAPER_BG}`}>
      {/* 1 Hero — halo blur (sin foto nítida pesada) */}
      <section className="relative isolate min-h-[min(68svh,40rem)] overflow-hidden pb-14 pt-[max(4.25rem,env(safe-area-inset-top))] md:min-h-[min(54svh,36rem)]">
        <div className="pointer-events-none absolute inset-0 -z-[1] opacity-98">
          <Image
            src="/DECO/deco004.png"
            alt=""
            fill
            sizes="100vw"
            className="scale-110 object-cover object-center blur-[52px]"
            aria-hidden
            priority
          />
          <GrainOverlay />
          <div className="absolute inset-0 bg-[#f4ede6]/90" aria-hidden />
        </div>

        <div className={`${bleed} team-rise relative pb-14 pt-10 md:pb-16 md:pt-14`}>
          <div className="max-w-6xl">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.38em] text-black/72">{tl.hero.eyebrow}</p>
            <h1 className="mt-8 font-display text-[clamp(1.85rem,7.8vw,5.85rem)] font-black uppercase leading-[0.93] tracking-[-0.02em] wrap-anywhere sm:mt-10 md:mt-11">
              <span className="block">{tl.hero.headline}</span>
              <span className="mt-1.5 block text-black/[0.86] sm:mt-2">{tl.hero.headlineAccent}</span>
            </h1>
            <p className={`mt-6 sm:mt-8 ${HERO_BODY}`}>{tl.hero.subtitle}</p>
            <p className={`mt-5 sm:mt-7 ${HERO_BODY}`}>{tl.hero.lead}</p>
          </div>
        </div>
      </section>

      {/* 2 Fundadoras */}
      <section className={`team-rise ${bleed} py-14 md:py-24`}>
        <FounderCollage t={tl.founders} />
      </section>

      {/* 3 Puente */}
      <section className={`team-rise ${bleed} border-y border-black bg-black/[0.035] py-12 text-center sm:py-16 md:py-20`}>
        <p className="mx-auto max-w-[min(100%,28rem)] font-display text-[clamp(1.35rem,6.8vw,3.85rem)] font-black uppercase leading-[1.06] tracking-[-0.03em] text-black wrap-anywhere sm:max-w-none md:leading-tight md:tracking-[-0.04em]">
          {tl.bridge}
        </p>
      </section>

      {/* 4 Intro equipo extendido */}
      <section className={`team-rise ${bleed} border-b border-black/10 p-12  md:p-20`}>
        <h2 className="wrap-anywhere font-display text-[clamp(1.5rem,7.2vw,3.55rem)] font-black uppercase leading-[1.02] tracking-[-0.02em] md:leading-[0.95]">
          {tl.introExtended.title}
        </h2>
        <div className="mt-7 max-w-3xl space-y-6 text-[0.98rem] leading-[1.74] text-black/88 md:mt-11 md:space-y-7 md:text-[1.09rem] md:leading-[1.78]">
          {tl.introExtended.paragraphs.map((para: string) => (
            <p key={para} className="m-0 wrap-anywhere">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* 5 Collage equipo (grilla 12 col) */}
      <section className={`team-rise ${bleed} py-16 md:py-24`}>
        <TeamSetupEditorialGrid t={tl} />
      </section>

      {/* 6 Cómo trabajamos */}
      <section className={`team-rise ${bleed} border-t border-black py-14 md:py-20`}>
        <h2 className="font-display text-[clamp(1.75rem,8.5vw,4.05rem)] font-black uppercase leading-[0.95]">{tl.howWeWorkTitle}</h2>
        <div className="mt-10 max-w-3xl space-y-8 text-[1.02rem] leading-[1.78] md:text-[1.1rem]">
          {tl.howWeWorkBody.map((para: string) => (
            <p key={para} className="m-0 wrap-anywhere">
              {para}
            </p>
          ))}
        </div>
      </section>

      {/* 7 Cierre */}
      <section className={`team-rise ${bleed} pb-[max(8rem,env(safe-area-inset-bottom))] pt-10 md:pt-14`}>
        <div role="presentation" className="h-px w-full bg-black/88" />
        <div className="mt-10 flex min-w-0 flex-col gap-10 sm:mt-12 sm:gap-12 md:flex-row md:items-end md:justify-between md:gap-16">
          <div className="min-w-0 max-w-xl space-y-4 sm:space-y-5">
            <h2 className="font-display text-[clamp(1.85rem,7.8vw,4.95rem)] font-black uppercase leading-[0.95] tracking-[-0.02em] wrap-anywhere sm:text-[clamp(2rem,8vw,4.95rem)]">
              {tl.closingTitle}
            </h2>
            <p className="wrap-anywhere whitespace-pre-line text-[0.96rem] leading-[1.72] md:text-[1.09rem]">{tl.closingLead}</p>
            <p className="wrap-anywhere text-[0.98rem] font-medium leading-snug text-black/80 sm:text-[1.02rem] md:text-[1.06rem]">{tl.closingPreCta}</p>
          </div>
          <Link
            href="/contact"
            className="hero-cta hero-cta--dark inline-flex w-full shrink-0 justify-center text-center no-underline sm:w-auto"
          >
            {tl.closingCta}
          </Link>
        </div>
      </section>
    </article>
  );
}
