"use client";

import Image from "next/image";
import type { PartnerLogoPublic } from "@/lib/partner-logos/types";

type PartnerLogoLoopProps = {
  logos: PartnerLogoPublic[];
  ariaLabel?: string;
};

function LogoItem({ logo }: { logo: PartnerLogoPublic }) {
  const inner = (
    <span className="flex h-40 w-[280px] shrink-0 items-center justify-center px-[10px] md:h-52 md:w-[360px] lg:h-90 lg:w-[400px]">
      <Image
        src={logo.imageUrl}
        alt=""
        width={400}
        height={380}
        className="max-h-full w-auto max-w-full object-contain transition-opacity duration-200"
        unoptimized={logo.imageUrl.endsWith(".svg")}
      />
    </span>
  );

  if (logo.linkUrl) {
    return (
      <a
        href={logo.linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="shrink-0 cursor-pointer outline-none"
        aria-label="Abrir sitio del cliente"
      >
        {inner}
      </a>
    );
  }

  return <span className="shrink-0 cursor-pointer">{inner}</span>;
}

/** Seamless horizontal logo marquee (Logo Loop style). Expects at least one logo. */
export function PartnerLogoLoop({ logos, ariaLabel }: PartnerLogoLoopProps) {
  if (logos.length === 0) return null;

  const cycle = logos.length < 6 ? [...logos, ...logos, ...logos, ...logos] : [...logos, ...logos];

  return (
    <div
      className="partner-logo-wrapper relative w-full overflow-hidden py-4 md:py-6"
      role="region"
      aria-label={ariaLabel}
    >
      {/* Left fade */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-32 bg-gradient-to-r from-[#f4ede6] to-transparent md:w-60 lg:w-100" aria-hidden />
      {/* Right fade */}
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-32 bg-gradient-to-l from-[#f4ede6] to-transparent md:w-60 lg:w-100" aria-hidden />

      <div className="partner-logo-marquee-track">
        <div className="flex items-center">
          {cycle.map((logo, i) => (
            <LogoItem key={`${logo.id}-a-${i}`} logo={logo} />
          ))}
        </div>

        <div className="flex items-center">
          {cycle.map((logo, i) => (
            <LogoItem key={`${logo.id}-b-${i}`} logo={logo} />
          ))}
        </div>
      </div>
    </div>
  );
}
