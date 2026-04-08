"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const TAPE_TEXT = "LAS GIRLS ESTÁN EN CONSTRUCCIÓN  ✦  ";
const tapeRepeat = (TAPE_TEXT.repeat(12) + TAPE_TEXT.repeat(12)); // doubled for seamless scroll

const FRAMES = [
  { src: "/construccion/construccion-01.png" as const, width: 500, height: 700 },
  { src: "/construccion/construccion-02.png" as const, width: 500, height: 700 },
] as const;

const TICK_MS = 1350;

export default function UnderConstructionPage() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % FRAMES.length);
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, []);
  return (
    <>
      <style>{`
        @keyframes tape-scroll {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes tape-scroll-rev {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .tape-anim        { animation: tape-scroll     18s linear infinite; }
        .tape-anim-rev    { animation: tape-scroll-rev 18s linear infinite; }
      `}</style>

      <div className="relative isolate flex min-h-[100dvh] flex-col overflow-hidden bg-[#f4ede6]">

        {/* ─── Construction tapes (z-20 so they overlay content) ─── */}
        <div aria-hidden className="pointer-events-none absolute inset-0 z-20 overflow-hidden">
          <TapeBand animClass="tape-anim"     rotate={-32} yOffset="-28vh" />
          <TapeBand animClass="tape-anim-rev" rotate={32}  yOffset="28vh" />
        </div>

        {/* ─── Main content (z-30 keeps it on top for interaction) ─── */}
        <div className="relative z-30 flex min-h-[100dvh] flex-col">

          {/* Logo */}
          <header className="flex items-center px-6 pt-8 sm:px-10 md:px-14">
            <Image
              src="/brand/logos/las-girls-horizontal-rosa.png"
              alt="Las Girls+"
              width={220}
              height={60}
              className="h-auto w-[140px] sm:w-[180px] md:w-[210px]"
              priority
            />
          </header>

          {/* Hero */}
          <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 sm:px-10 md:px-14">
            <div className="flex w-full max-w-5xl flex-col items-center gap-10 md:flex-row md:items-center md:gap-14 lg:gap-20">

              {/* Girls sticker — alternates between the two images like the home hero */}
              <div
                aria-hidden
                className="relative shrink-0 w-[220px] sm:w-[260px] md:w-[300px] lg:w-[340px]"
                style={{ aspectRatio: "5/7" }}
              >
                {FRAMES.map((frame, index) => {
                  const isActive = index === activeIndex;
                  return (
                    <Image
                      key={frame.src}
                      src={frame.src}
                      alt=""
                      width={frame.width}
                      height={frame.height}
                      priority={index === 0}
                      className={[
                        "absolute inset-0 h-full w-full object-contain object-bottom",
                        "drop-shadow-[8px_18px_0_rgba(17,17,17,0.09)]",
                        "origin-bottom",
                        "transition-[opacity,transform] duration-500 ease-out",
                        isActive
                          ? "z-[2] opacity-100 rotate-0"
                          : "z-[1] opacity-0 -rotate-[1.75deg]",
                      ].join(" ")}
                    />
                  );
                })}
              </div>

              {/* Copy */}
              <div className="flex flex-col items-center text-center md:items-start md:text-left">
                <span
                  className="mb-3 inline-block rounded-full border-2 border-black px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.2em] text-white"
                  style={{ fontFamily: "var(--font-display)", background: "#ff3ea5" }}
                >
                  Próximamente
                </span>

                <h1
                  className="text-[clamp(3rem,9vw,5.2rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] text-black"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Sitio en<br />
                  <span style={{ color: "#ff3ea5" }}>construcción</span>
                </h1>

                <p className="mt-5 max-w-[40ch] text-base leading-relaxed text-black/65 md:text-lg">
                  Estamos armando algo increíble. Mientras tanto, si ya nos conocés,
                  podés escribirnos directo.
                </p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:justify-start">
                  <a
                    href="https://www.instagram.com/lasgirls.plus?igsh=MWdyZXEybXYyOW9tOQ%3D%3D&utm_source=qr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-full bg-black px-6 py-3 text-sm font-black uppercase tracking-wide text-white transition-transform hover:scale-105 active:scale-95"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    Seguinos
                  </a>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

function TapeBand({
  animClass,
  rotate,
  yOffset,
}: {
  animClass: string;
  rotate: number;
  yOffset: string;
}) {
  return (
    <div
      className="absolute flex items-center overflow-hidden"
      style={{
        width: "200vmax",
        height: "clamp(2.6rem, 5vw, 3.8rem)",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) rotate(${rotate}deg) translateY(${yOffset})`,
        background: "#ff3ea5",
        borderTop: "2px solid rgba(0,0,0,0.14)",
        borderBottom: "2px solid rgba(0,0,0,0.14)",
        boxShadow: "0 6px 40px rgba(0,0,0,0.16)",
      }}
    >
      <span
        className={animClass}
        style={{
          fontFamily: "var(--font-display), sans-serif",
          fontSize: "clamp(0.78rem, 1.6vw, 1.1rem)",
          fontWeight: 900,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: "white",
          whiteSpace: "nowrap",
          display: "inline-block",
        }}
      >
        {tapeRepeat}
      </span>
    </div>
  );
}
