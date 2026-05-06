"use client";

import { PartnerLogoLoop } from "@/components/sections/partner-logo-loop";
import { useDictionary } from "@/i18n/locale-provider";
import type { PartnerLogoPublic } from "@/lib/partner-logos/types";

const CONTACT_ANCHOR = "contacto";
const CONTACT_FOCUS_ID = "contact-form-focus";

function scrollToContactAndFocus() {
  const section = document.getElementById(CONTACT_ANCHOR);
  section?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => {
    document.getElementById(CONTACT_FOCUS_ID)?.focus({ preventScroll: true });
  }, 480);
}

type PartnerTrustSectionProps = {
  logos: PartnerLogoPublic[];
};

export function PartnerTrustSection({ logos }: PartnerTrustSectionProps) {
  const t = useDictionary().partnerTrust;

  return (
    <section
      className="relative w-full overflow-hidden border-t-2 border-black bg-[#f4ede6] pb-16 md:pb-20"
      aria-labelledby="partner-trust-title"
    >
      <div className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:radial-gradient(circle_at_20%_20%,rgba(255,62,165,0.35),transparent_42%),radial-gradient(circle_at_80%_60%,rgba(17,17,17,0.04),transparent_35%)]" />

      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-8 px-4 pb-6 pt-14 sm:px-6 md:gap-10 md:pb-8 md:pt-16 lg:px-10 lg:pt-20">
        <header className="max-w-4xl space-y-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-black/55 md:text-[11px]">
            {t.kicker}
          </p>
          <h2
            id="partner-trust-title"
            className="font-display text-[clamp(2rem,5vw,3.75rem)] font-black uppercase leading-[0.95] tracking-[-0.03em] text-black"
          >
            {t.titleBefore}
            <span className="font-accent text-[#ff3ea5] normal-case">{t.titleAccent}</span>
          </h2>
          <p className="max-w-[62ch] text-base leading-[1.65] text-black/75 md:text-lg">{t.subtitle}</p>

          <div className="pt-2">
            <button
              type="button"
              onClick={scrollToContactAndFocus}
              className="group inline-flex items-center gap-2 border-b-2 border-black bg-transparent pb-1 font-display text-sm font-extrabold uppercase tracking-[0.14em] text-black transition hover:border-[#ff3ea5] hover:text-[#ff3ea5]"
            >
              <span>{t.cta}</span>
              <span className="transition-transform group-hover:translate-x-1" aria-hidden>
                →
              </span>
            </button>
          </div>
        </header>
      </div>

      {logos.length > 0 ? (
        <div className="relative z-10 mt-8 md:mt-12">
          <PartnerLogoLoop logos={logos} ariaLabel={t.marqueeLabel} />
        </div>
      ) : null}
    </section>
  );
}
