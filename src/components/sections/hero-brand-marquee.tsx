function MarqueeChunk() {
  return (
    <div className="flex shrink-0 items-center gap-x-3 whitespace-nowrap pl-2 pr-6 md:pl-3 md:pr-8">
      <span>LAS GIRLS+</span>
      <span className="text-[var(--pink)]">•</span>
      <span>CUMBIA VISUAL</span>
      <span className="text-[var(--pink)]">•</span>
      <span>MATE Y CODIGO</span>
      <span className="text-[var(--pink)]">•</span>
      <span>ACOMPAÑAMIENTO</span>
      <span className="text-[var(--pink)]">•</span>
      <span>PRODUCTOS REALES</span>
      <span className="text-[var(--pink)]">•</span>
      <span>TECH Y RITMO</span>
    </div>
  );
}

export function HeroBrandMarquee() {
  return (
    <div className="hero-soft-line relative z-10 self-start w-full max-w-[40%] min-w-0 rotate-[-1.4deg] rounded-full bg-black text-xs font-bold uppercase tracking-[0.22em] text-[#f4ede6] md:text-[13px]">
      <p className="sr-only">
        LAS GIRLS+ · BRANDING · TECH · ESTRATEGIA · PRODUCTO
      </p>
      <div className="overflow-hidden py-2 md:py-2.5" aria-hidden>
        <div className="lgs-hero-marquee__track flex w-max will-change-transform">
          <MarqueeChunk />

          <MarqueeChunk />
        </div>
      </div>
    </div>
  );
}
