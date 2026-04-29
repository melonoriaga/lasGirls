"use client";

import Image from "next/image";
import Link from "next/link";
import { TEAM_SETUP_IMAGES } from "@/content/teamSetup/team-setup-images";

const PAPER_BG = "bg-[#f4ede6]";
/** Columna foto: cuadrado estricto (sin radios) · 1:1 */
const PHOTO_SHELL =
  "relative aspect-square w-full overflow-hidden rounded-none";

const FOUNDER_PADDING = `p-6 sm:p-8 lg:p-10`;

const BODY_CLASS =
  "max-w-none whitespace-pre-line text-[1rem] leading-[1.78] text-black/88 md:text-[1.06rem]";

function FounderPhotoFrame({
  src,
  alt,
  priority,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  return (
    <div className={PHOTO_SHELL}>
      <Image
        src={src}
        alt={alt}
        fill
        quality={88}
        className="object-cover object-center"
        sizes="(min-width:1536px) min(520px, 34vw), (min-width:1024px) 36vw, 100vw"
        priority={priority}
      />
    </div>
  );
}

export function FounderCollage({
  t,
}: {
  t: {
    eyebrow: string;
    jean: {
      eyebrowLocal: string;
      title: string;
      body: string;
      profileCta: string;
    };
    mel: {
      eyebrowLocal: string;
      title: string;
      body: string;
      profileCta: string;
    };
  };
}) {
  return (
    <div className={PAPER_BG}>
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-black/65">{t.eyebrow}</p>

      <div className="mt-8 overflow-hidden rounded-none border border-black/15 lg:mt-10">
        {/* Jean — col 1 foto · cols 2–3 texto */}
        <div
          className={`grid grid-cols-1 items-start gap-0 divide-y divide-black/10 border-b border-black/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0 ${PAPER_BG}`}
        >
          <div className="relative self-stretch p-0 lg:col-span-1">
            <FounderPhotoFrame
              priority
              src={TEAM_SETUP_IMAGES.founderJean}
              alt="Jean — setup Las Girls"
            />
          </div>
          <div className={`flex flex-col gap-6 sm:gap-7 ${FOUNDER_PADDING} lg:col-span-2`}>
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/70">
              {t.jean.eyebrowLocal}
            </p>
            <h2 className="font-display text-[clamp(2rem,6vw,3.75rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] wrap-anywhere text-balance">
              {t.jean.title}
            </h2>
            <p className={BODY_CLASS}>{t.jean.body}</p>
            <Link
              href="/team/jean"
              className="hero-cta hero-cta--dark mt-1 inline-flex w-full max-w-md justify-center no-underline sm:w-fit"
            >
              {t.jean.profileCta}
            </Link>
          </div>
        </div>

        {/* Mel — desktop: texto cols 1–2 · foto col 3 · móvil: misma lectura que Jean (foto primero) */}
        <div
          className={`grid grid-cols-1 items-start gap-0 divide-y divide-black/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0 ${PAPER_BG}`}
        >
          <div
            className={`order-2 flex flex-col gap-6 sm:gap-7 lg:order-1 lg:col-span-2 ${FOUNDER_PADDING}`}
          >
            <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/70">
              {t.mel.eyebrowLocal}
            </p>
            <h2 className="font-display text-[clamp(2rem,6vw,3.75rem)] font-black uppercase leading-[0.9] tracking-[-0.02em] wrap-anywhere text-balance">
              {t.mel.title}
            </h2>
            <p className={BODY_CLASS}>{t.mel.body}</p>
            <Link
              href="/team/mel"
              className="hero-cta hero-cta--dark mt-1 inline-flex w-full max-w-md justify-center no-underline sm:w-fit"
            >
              {t.mel.profileCta}
            </Link>
          </div>
          <div className="relative order-1 self-stretch p-0 lg:order-2 lg:col-span-1">
            <FounderPhotoFrame src={TEAM_SETUP_IMAGES.founderMel} alt="Mel — setup Las Girls" />
          </div>
        </div>
      </div>
    </div>
  );
}
