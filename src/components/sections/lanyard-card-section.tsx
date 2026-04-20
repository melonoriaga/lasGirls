"use client";

import Link from "next/link";
import dynamic from "next/dynamic";

// Load the 3D lanyard client-side only to keep it out of SSR bundles
// (three.js + rapier touch the DOM / WebGL).
const Lanyard = dynamic(() => import("@/components/Lanyard"), { ssr: false });

export function LanyardCardSection() {
  return (
    <section className="relative overflow-hidden border-t-2 border-black bg-black py-20 text-[#fff8f0] md:py-28">
      {/* Subtle pink glow behind the card */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-[12%] top-1/2 z-0 size-[520px] -translate-y-1/2 rounded-full bg-[#ff3ea5]/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 md:px-10 lg:grid-cols-12 lg:gap-16">
        {/* LEFT — Lanyard card (3D) */}
        <div className="order-2 h-[520px] w-full md:h-[620px] lg:order-1 lg:col-span-7 lg:h-[680px]">
          <Lanyard
            position={[0, 0, 13]}
            gravity={[0, -40, 0]}
            fov={28}
            cardColor="#ff3ea5"
            cardStickerUrl="/brand/stickers/STICKER7.png"
            strapColor="#ff6faf"
            strapStickerUrl="/brand/stickers/STICKER9.png"
          />
        </div>

        {/* RIGHT — Editorial CTA */}
        <div className="order-1 flex flex-col gap-7 lg:order-2 lg:col-span-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex bg-[#ff3ea5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
              04 — Tu pase de entrada
            </span>
            <span className="hidden h-px flex-1 bg-white/15 md:block" />
          </div>

          <h2 className="font-display text-[clamp(2rem,4.6vw,3.6rem)] font-black uppercase leading-[1.02] tracking-normal text-[#f4ede6]">
            Llevátela{" "}
            <span className="text-[#ff3ea5]">puesta.</span>
          </h2>

          <p className="max-w-[42ch] text-base leading-[1.65] text-white/75 md:text-[1.05rem]">
            Tu tarjeta Las Girls+ no es decorativa. Es el acceso directo a un
            equipo que se arma a tu medida, sin intermediarios ni mil mails de
            ida y vuelta.
          </p>

          <p className="max-w-[42ch] font-mono text-xs uppercase tracking-[0.18em] text-white/55">
            ↓ Tirá del cordón, jugá con ella.
          </p>

          <div className="mt-2 flex flex-wrap gap-3">
            <Link
              href="#contacto"
              className="group inline-flex items-center gap-2 bg-[#ff3ea5] px-6 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-black transition-colors hover:bg-white"
            >
              Quiero la mía
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </Link>
            <Link
              href="/team"
              className="inline-flex items-center gap-2 border-2 border-white/30 px-6 py-3.5 font-display text-sm font-bold uppercase tracking-widest text-white transition-colors hover:border-white hover:bg-white hover:text-black"
            >
              Conocer al equipo
            </Link>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <span className="font-mono">Las Girls+ / Pass · Edición 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
}
