"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import CircularText from "@/components/CircularText";
import DecryptedText from "@/components/DecryptedText";
import { StickerWindows } from "@/components/sections/sticker-windows";

gsap.registerPlugin(ScrollTrigger);

const TEAM_STICKERS = [
  { id: "t1", src: "/brand/stickers/STICKER7.png", x: 15, y: 68, w: 400, rotate: 7, delay: 0.18 },
];

/** Home “strategic team” strip with Jean & Mel ally cards. */
export function HomeTeamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);

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
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      id="equipo"
      ref={sectionRef}
      className="brutal-section vh-section section-shell relative border-t-2 border-black bg-[#111] text-[#fff8f0]"
    >
      <StickerWindows items={TEAM_STICKERS} />
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center">
        <p className="brutal-reveal inline-flex bg-[#ff5faf] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">
          equipo estratégico
        </p>
        <h2 className="brutal-reveal mt-4 font-display text-6xl uppercase leading-[0.86] text-[#f4ede6] lg:text-8xl">
          <DecryptedText
            text="no hacemos todo solas."
            speed={26}
            maxIterations={12}
            sequential
            animateOn="view"
            className="inline-block"
            encryptedClassName="inline-block text-white/55"
          />
        </h2>
        <p className="brutal-reveal mt-4 max-w-xl text-sm text-white/70">
          Trabajamos con red real de especialistas. Vos hablás con nosotras: nos encargamos del resto.
        </p>

        <div className="allies-grid brutal-reveal mt-8">
          <Link href="/team/jean" className="ally-card group block" aria-label="Ver perfil de Jean">
            <div className="ally-ring-wrap" aria-hidden>
              <CircularText
                text="JEAN ✦ JEAN ✦ JEAN ✦ JEAN ✦ JEAN ✦ JEAN ✦ "
                spinDuration={16}
                onHover="speedUp"
                className="ally-ring"
              />
            </div>
            <div className="ally-image-wrap">
              <Image src="/brand/girls/jean.png" alt="Jean" fill unoptimized className="ally-image object-contain object-bottom" />
            </div>
            <div className="ally-tag">✦ ESTRATEGIA & ROADMAP</div>
            <div className="ally-overlay">
              <h3 className="ally-name">
                <DecryptedText
                  text="JEAN"
                  speed={24}
                  maxIterations={12}
                  sequential
                  animateOn="view"
                  className="inline-block"
                  encryptedClassName="inline-block text-[#f4ede6]/55"
                />
              </h3>
              <p className="ally-script">estructura que ordena.</p>
              <div className="ally-skills">
                <span>Discovery</span>
                <span>Roadmaps</span>
                <span>Producto</span>
              </div>
            </div>
          </Link>

          <Link href="/team/mel" className="ally-card group block" aria-label="Ver perfil de Mel">
            <div className="ally-ring-wrap" aria-hidden>
              <CircularText
                text="MEL ✦ MEL ✦ MEL ✦ MEL ✦ MEL ✦ MEL ✦ "
                spinDuration={14}
                onHover="speedUp"
                className="ally-ring"
              />
            </div>
            <div className="ally-image-wrap">
              <Image src="/brand/girls/mel.png" alt="Mel" fill unoptimized className="ally-image object-contain object-bottom" />
            </div>
            <div className="ally-tag">✦ BRANDING & DIRECCIÓN CREATIVA</div>
            <div className="ally-overlay">
              <h3 className="ally-name">
                <DecryptedText
                  text="MEL"
                  speed={24}
                  maxIterations={12}
                  sequential
                  animateOn="view"
                  className="inline-block"
                  encryptedClassName="inline-block text-[#f4ede6]/55"
                />
              </h3>
              <p className="ally-script">identidad que se recuerda.</p>
              <div className="ally-skills">
                <span>Branding</span>
                <span>Visual Systems</span>
                <span>Narrativa</span>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
