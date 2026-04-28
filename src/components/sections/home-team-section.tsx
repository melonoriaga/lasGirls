"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DecryptedText from "@/components/DecryptedText";
import TextType from "@/components/TextType";
import ProfileCard from "@/components/ProfileCard";
import { useDictionary } from "@/i18n/locale-provider";

gsap.registerPlugin(ScrollTrigger);

/** Home strategic team section — editorial / brutalist layout with the
 *  Jean & Mel ProfileCards plus an extended copy block describing the
 *  network model. */
export function HomeTeamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const tm = useDictionary().team;
  const specialistTags = tm.tags;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        section.querySelectorAll(".brutal-reveal"),
        { autoAlpha: 0, y: 60, scale: 0.97 },
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.9,
          stagger: 0.09,
          ease: "power3.out",
          scrollTrigger: {
            trigger: section,
            start: "top 78%",
          },
        },
      );

      gsap.fromTo(
        section,
        { backgroundPositionY: "0%" },
        {
          backgroundPositionY: "10%",
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        },
      );

      // Pink underline / divider reveals as you scroll into block 02
      gsap.utils
        .toArray<HTMLElement>(section.querySelectorAll(".brutal-rule"))
        .forEach((rule) => {
          gsap.fromTo(
            rule,
            { scaleX: 0, transformOrigin: "left center" },
            {
              scaleX: 1,
              duration: 1.1,
              ease: "expo.out",
              scrollTrigger: {
                trigger: rule,
                start: "top 85%",
              },
            },
          );
        });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="equipo"
      ref={sectionRef}
      className="brutal-section section-shell relative overflow-hidden border-t-2 border-black bg-[#0b0b0b] py-24 text-[#fff8f0] md:py-32"
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-24 px-6 md:gap-32 md:px-10">
        {/* ─────────── BLOCK 01 — HEADER + CARDS ─────────── */}
        <div className="flex flex-col gap-12">
          <header className="flex flex-col gap-6">
            <div className="brutal-reveal flex items-center gap-4">
              <span className="inline-flex bg-[#ff3ea5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
                {tm.eyebrow01}
              </span>
              <span className="hidden h-px flex-1 bg-white/15 md:block" />
            </div>

            <h2 className="brutal-reveal w-full font-display text-[clamp(2rem,5.4vw,4.5rem)] font-black uppercase leading-[1.02] tracking-normal text-[#f4ede6]">
              <DecryptedText
                text={tm.h2}
                speed={26}
                maxIterations={14}
                sequential
                animateOn="view"
                className="inline"
                encryptedClassName="inline text-white/45"
              />
              <span className="text-[#ff3ea5]">.</span>
            </h2>

            <div className="brutal-reveal mt-2 max-w-2xl border-l-2 border-[#ff3ea5] pl-5">
              <TextType
                as="p"
                text={tm.leadIn}
                typingSpeed={28}
                initialDelay={300}
                pauseDuration={1200}
                loop={false}
                showCursor
                cursorCharacter="▌"
                cursorClassName="text-[#ff3ea5]"
                startOnVisible
                className="font-display text-base uppercase leading-[1.45] tracking-[0.04em] text-white/85 md:text-lg"
              />
              <p className="mt-3 font-display text-base uppercase leading-[1.45] tracking-[0.04em] text-white md:text-lg">
                {tm.vosHablas}
                <span className="text-[#ff3ea5]">
                  {tm.armamosEquipo}
                </span>
              </p>
            </div>
          </header>

          <div className="brutal-reveal mt-4 grid grid-cols-1 items-start justify-items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">
            <ProfileCard
              name="JEAN"
              title="Brand Designer & Visual Identity Lead"
              handle="jean"
              status={tm.profileAvailable}
              contactText={tm.profileContact}
              avatarUrl="/brand/girls/jean.png"
              miniAvatarUrl="/brand/girls/jean.png"
              iconUrl="/brand/logos/las-girls-vertical-rosa.png"
              behindGlowColor="rgba(255, 62, 165, 0.25)"
              avatarBottom="-200px"
              contactHref="/team/jean"
            />
            <ProfileCard
              name="MEL"
              title="Product Designer & Developer"
              handle="mel"
              status={tm.profileAvailable}
              contactText={tm.profileContact}
              avatarUrl="/brand/girls/mel.png"
              miniAvatarUrl="/brand/girls/mel.png"
              iconUrl="/brand/logos/las-girls-vertical-rosa.png"
              behindGlowColor="rgba(211, 66, 145, 0.25)"
              avatarBottom="-200px"
              contactHref="/team/mel"
            />
          </div>
        </div>

        {/* ─────────── BLOCK 02 — EL SISTEMA ─────────── */}
        <div className="flex flex-col gap-10">
          <div className="brutal-reveal flex items-center gap-4">
            <span className="inline-flex border-2 border-white/80 bg-transparent px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              {tm.eyebrow02}
            </span>
            <span className="brutal-rule h-[2px] flex-1 bg-[#ff3ea5]" />
          </div>

          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
            {/* LEFT col — editorial body */}
            <div className="brutal-reveal flex flex-col gap-7 lg:col-span-7">
              <p className="font-display text-[clamp(1.5rem,2.4vw,2rem)] font-black uppercase leading-[1.05] tracking-[-0.005em] text-[#f4ede6]">
                {tm.sistemaP1Line1a}
                <br />
                <span className="text-[#ff3ea5]">
                  {tm.sistemaP1Line1bHighlight}
                </span>
              </p>

              <p className="max-w-[55ch] text-base leading-[1.65] text-white/75 md:text-[1.05rem]">
                {tm.sistemaP2}
              </p>

              {/* <p className="max-w-[55ch] text-base leading-[1.65] text-white/75 md:text-[1.05rem]">
                Nosotras lideramos, ordenamos y ejecutamos. El resto del equipo
                aparece cuando tiene que aparecer.
              </p> */}
            </div>

            {/* RIGHT col — specialist roster */}
            <aside className="brutal-reveal lg:col-span-5">
              <div className="relative border-2 border-white/15 bg-white/3 p-7 md:p-8">
                <span className="absolute -top-3 left-6 bg-[#0b0b0b] px-2 font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
                  {tm.specialistRosterEyebrow}
                </span>

                <p className="font-display text-base uppercase leading-[1.4] tracking-[0.04em] text-white/85 md:text-[1.05rem]">
                  {tm.equipoCrece}
                </p>

                <ul className="mt-6 flex flex-wrap gap-2.5">
                  {specialistTags.map((tag, i) => (
                    <li
                      key={tag}
                      className={`inline-flex items-center gap-2 border-2 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] transition-colors ${i % 2 === 0
                        ? "border-[#ff3ea5] bg-[#ff3ea5]/10 text-[#ff8ec7] hover:bg-[#ff3ea5] hover:text-black"
                        : "border-white/40 bg-transparent text-white/85 hover:border-white hover:bg-white hover:text-black"
                        }`}
                    >
                      <span className="text-[8px]">◆</span>
                      {tag}
                    </li>
                  ))}
                </ul>

                <div className="mt-7 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] uppercase tracking-[0.18em] text-white/50">
                  <span>{tm.modeloNetwork}</span>
                  <span className="font-mono">{tm.onDemand}</span>
                </div>
              </div>
            </aside>
          </div>
        </div>

        {/* ─────────── BLOCK 03 — CIERRE / QUOTE ─────────── */}
        <div className="flex flex-col gap-8">
          <div className="brutal-reveal flex items-center gap-4">
            <span className="brutal-rule h-[2px] flex-1 bg-white/30" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/60">
              {tm.eyebrow03}
            </span>
          </div>

          <blockquote className="brutal-reveal relative">
            <span
              aria-hidden
              className="absolute -left-2 -top-10 font-display text-[6rem] font-black leading-none text-[#ff3ea5]/20 md:-left-4 md:-top-14 md:text-[10rem]"
            >
              “
            </span>
            <p className="relative font-display text-[clamp(2rem,5vw,4rem)] font-black uppercase leading-[0.95] tracking-[-0.01em] text-[#f4ede6]">
              {tm.quotePrefix}
              <DecryptedText
                text={tm.quoteVerb}
                speed={32}
                maxIterations={14}
                sequential
                animateOn="view"
                className="inline-block text-[#ff3ea5]"
                encryptedClassName="inline-block text-[#ff3ea5]/40"
              />
              <span className="whitespace-pre-line">{tm.quoteRest}</span>
            </p>
          </blockquote>
        </div>
      </div>
    </section>
  );
}
