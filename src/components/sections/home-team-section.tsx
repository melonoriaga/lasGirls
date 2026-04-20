"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import DecryptedText from "@/components/DecryptedText";
import ProfileCard from "@/components/ProfileCard";
import { StickerWindows } from "@/components/sections/sticker-windows";

gsap.registerPlugin(ScrollTrigger);

const TEAM_STICKERS = [
  { id: "t1", src: "/brand/stickers/STICKER7.png", x: 15, y: 68, w: 400, rotate: 7, delay: 0.18 },
];

/** Home strategic team section with Jean & Mel profile cards. */
export function HomeTeamSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const router = useRouter();

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
      {/* <StickerWindows items={TEAM_STICKERS} /> */}
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

        <div className="brutal-reveal mt-12 grid grid-cols-1 items-start justify-items-center gap-10 md:grid-cols-2 md:gap-14 lg:gap-20">

          <ProfileCard
            name="JEAN"
            title="Brand Designer & Visual Identity Lead"
            handle="jean"
            status="Disponible"
            contactText="Ver perfil"
            avatarUrl="/brand/girls/jean.png"
            miniAvatarUrl="/brand/girls/jean.png"
            iconUrl="/brand/logos/las-girls-vertical-rosa.png"
            behindGlowColor="rgba(255, 62, 165, 0.15)"
            avatarBottom="-200px"
            onContactClick={() => router.push("/team/jean")}
          />

          <ProfileCard
            name="MEL"
            title="Product Designer & Developer"
            handle="mel"
            status="Disponible"
            contactText="Ver perfil"
            avatarUrl="/brand/girls/mel.png"
            miniAvatarUrl="/brand/girls/mel.png"
            iconUrl="/brand/logos/las-girls-vertical-rosa.png"
            behindGlowColor="rgba(211, 66, 145, 0.15)"
            avatarBottom="-200px"
            onContactClick={() => router.push("/team/mel")}
          />
        </div>
      </div>
    </section>
  );
}
