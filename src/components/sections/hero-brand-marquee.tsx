"use client";

import { useMemo } from "react";
import { useDictionary } from "@/i18n/locale-provider";

function MarqueeChunk({ items }: { items: readonly string[] }) {
  const pink = (
    <>
      {" "}
      <span className="text-[var(--pink)]">•</span>{" "}
    </>
  );
  return (
    <div className="flex shrink-0 items-center gap-x-3 whitespace-nowrap pl-2 pr-6 md:pl-3 md:pr-8">
      {items.map((item, i) => (
        <span key={`${item}-${i}`} className="inline-flex items-center">
          {i > 0 ? pink : null}
          <span>{item}</span>
        </span>
      ))}
    </div>
  );
}

export function HeroBrandMarquee() {
  const d = useDictionary();
  const items = useMemo(() => [...d.marquee.items], [d.marquee.items]);

  return (
    <div className="hero-soft-line relative z-10 self-start w-full max-w-full min-w-0 rotate-[-1.4deg] rounded-full bg-black text-xs font-bold uppercase tracking-[0.22em] text-[#f4ede6] md:max-w-[30%] md:text-[13px]">
      <p className="sr-only">{d.marquee.sr}</p>
      <div className="overflow-hidden py-2 md:py-2.5" aria-hidden>
        <div className="lgs-hero-marquee__track flex w-max will-change-transform">
          <MarqueeChunk items={items} />
          <MarqueeChunk items={items} />
        </div>
      </div>
    </div>
  );
}
