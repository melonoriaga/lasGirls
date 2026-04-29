"use client";

import dynamic from "next/dynamic";
import { VipLanyardCTAs } from "@/components/sections/vip-lanyard-modals";
import { useDictionary } from "@/i18n/locale-provider";

const Lanyard = dynamic(() => import("@/components/Lanyard"), { ssr: false });

export function LanyardCardSection() {
  const Ly = useDictionary().lanyard;

  return (
    <section className="relative overflow-hidden border-t-2 border-black bg-black py-20 text-[#fff8f0] md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[12%] top-1/2 z-0 size-[520px] -translate-y-1/2 rounded-full bg-[#ff3ea5]/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-14 px-6 md:px-10 lg:grid-cols-12 lg:gap-16">
        <div className="order-2 h-[520px] w-full md:h-[620px] lg:order-1 lg:col-span-7 lg:h-[680px]">
          <Lanyard
            position={[0, 0, 13]}
            gravity={[0, -40, 0]}
            fov={28}
            cardColor="#ed70a8"
            cardStickerUrl="/brand/cards/FRENTE.png"
            strapColor="#ff3ea5"
            strapStickerUrl="/brand/stickers/STICKER9.png"
            logoScale={1.4}
            logoOffsetX={0.00002}
            logoOffsetY={-0.04}
          />
        </div>

        <div className="order-1 flex flex-col gap-7 lg:order-2 lg:col-span-5">
          <div className="flex items-center gap-4">
            <span className="inline-flex rounded-xl bg-[#ff3ea5] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-black">
              {Ly.eyebrow}
            </span>
            <span className="hidden h-px flex-1 bg-white/15 md:block" />
          </div>

          <h2 className="font-display text-[clamp(2rem,4.6vw,3.6rem)] font-black uppercase leading-[1.02] tracking-normal text-[#f4ede6]">
            {Ly.h2Prefix}
            <span className="text-[#ff3ea5]">{Ly.h2Accent}</span>
          </h2>

          <p className="max-w-[42ch] text-base leading-[1.65] text-white/75 md:text-[1.05rem]">
            {Ly.body}
          </p>

          <p className="max-w-[42ch] font-mono text-xs uppercase tracking-[0.18em] text-white/55">
            {Ly.hint}
          </p>

          <VipLanyardCTAs />

          <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5 text-[10px] uppercase tracking-[0.2em] text-white/40">
            <span className="font-mono">{Ly.edition}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
