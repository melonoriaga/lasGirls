"use client";

import Image from "next/image";
import type { ReactNode } from "react";

const PAPER_PANEL = "bg-[#f4ede6]";
/** Bloque solo texto · social / acentos pastel (alineado a stickers hero) */
const SOLID_ROSE = "bg-[#fde4ef]";
const SOLID_BEIGE = "bg-[#efe7dd]";
const EDGE = "border-black/12";

/** Copy editorial en panel papel (servicios / fundadoras). */
function SetupEditorialCopy({
  eyebrow,
  hook,
  rest,
}: {
  eyebrow?: string;
  hook?: ReactNode;
  rest: readonly string[];
}) {
  return (
    <>
      {eyebrow ? (
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.28em] text-black/70 sm:text-[11px]">
          {eyebrow}
        </p>
      ) : null}
      {hook ? (
        <div className="wrap-anywhere font-display text-[clamp(1.05rem,3.4vw,1.95rem)] font-black uppercase leading-[1.08] tracking-[0.02em] text-black text-balance">
          {hook}
        </div>
      ) : null}
      <div className="flex flex-col gap-3 md:gap-4">
        {rest.map((line, i) => (
          <p key={`${i}-${line.slice(0, 24)}`} className="m-0 wrap-anywhere text-[0.92rem] leading-[1.72] text-black/88 sm:text-[0.95rem] md:text-[1.04rem]">
            {line}
          </p>
        ))}
      </div>
    </>
  );
}

type SetupVariant = "photo" | "quote" | "solid";

type SetupCardProps = {
  src?: string;
  alt?: string;
  eyebrow?: string;
  hook?: ReactNode;
  rest: readonly string[];
  variant?: SetupVariant;
  solidTone?: "rose" | "beige";
  aspect?: "square" | "video";
  className?: string;
  imageClassName?: string;
  imageSizes?: string;
  priority?: boolean;
  splitWide?: boolean;
  /** `variant="quote"` en mitad de fila (6 cols) */
  quoteLayout?: "full" | "half";
};

/** Tarjeta de setup: foto limpía + texto en panel editorial (sin overlay sobre la imagen). */
export function SetupCard({
  src,
  alt,
  eyebrow,
  hook,
  rest,
  variant = "photo",
  aspect = "square",
  className,
  imageClassName,
  imageSizes = "(min-width:1536px) 560px, (min-width:1024px) 38vw, 100vw",
  priority,
  splitWide = false,
  solidTone = "rose",
  quoteLayout = "full",
}: SetupCardProps) {
  if (variant === "quote") {
    const halfRow = quoteLayout === "half";
    return (
      <article
        className={`team-rise relative flex min-w-0 flex-col items-stretch justify-center rounded-none border border-black/15 ${PAPER_PANEL} ${halfRow
          ? "min-h-[min(40vw,22rem)] px-6 py-10 sm:min-h-[20rem] sm:px-8 sm:py-12"
          : "min-h-[min(52vw,26rem)] px-5 py-12 sm:min-h-[min(44vw,28rem)] sm:px-10 sm:py-16"
          } ${className ?? ""}`}
      >
        <blockquote
          className={`flex w-full max-w-none flex-col text-left ${halfRow ? "gap-6 sm:gap-7" : "gap-8 sm:gap-10"}`}
        >
          {rest.map((line) => (
            <p
              key={line}
              className={`font-display font-black uppercase leading-[1.06] tracking-[-0.02em] text-black ${halfRow ? "text-[clamp(1.1rem,4.2vw,2.05rem)]" : "text-[clamp(1.45rem,5vw,2.85rem)]"}`}
            >
              {line}
            </p>
          ))}
        </blockquote>
      </article>
    );
  }

  if (variant === "solid") {
    const surface = solidTone === "beige" ? SOLID_BEIGE : SOLID_ROSE;
    return (
      <article
        className={`team-rise flex h-full min-h-[min(17rem,48vw)] min-w-0 flex-col justify-center rounded-none border border-black/14 ${surface} px-6 py-10 sm:min-h-56 sm:px-8 sm:py-12 lg:h-full ${className ?? ""}`}
      >
        <div className="flex max-w-none flex-col gap-4 sm:gap-5">
          <SetupEditorialCopy eyebrow={eyebrow} hook={hook} rest={rest} />
        </div>
      </article>
    );
  }

  if (!src) return null;

  /** Frontend: 16:9 · min-height real en md+ (evitar `md:!min-h-0`, anulaba el mínimo con `!important`). */
  const shellFeaturedSplit =
    "aspect-[16/9] w-full min-h-[min(440px,78vw)] shrink-0 sm:min-h-[min(560px,50vw)] md:col-span-8 md:!aspect-auto md:h-full md:min-h-[min(48rem,72vh)] lg:min-h-[min(54rem,70vh)] xl:min-h-[min(56rem,66vh)]";

  return (
    <article
      className={`team-rise group/card flex h-full min-w-0 flex-col overflow-hidden rounded-none border ${EDGE} ${PAPER_PANEL} md:min-h-0 lg:min-h-0 ${splitWide ? "md:grid md:grid-cols-12 md:items-stretch" : ""} ${className ?? ""}`}
    >
      {splitWide ? (
        <div className={`relative w-full shrink-0 overflow-hidden bg-neutral-950 md:max-h-none ${shellFeaturedSplit}`}>
          <div className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform group-hover/card:scale-[1.02] motion-reduce:scale-100 motion-reduce:transition-none">
            <Image
              src={src}
              alt={alt ?? ""}
              fill
              quality={88}
              className={`object-cover object-center ${imageClassName ?? ""}`}
              sizes={imageSizes}
              priority={priority}
            />
          </div>
        </div>
      ) : aspect === "square" ? (
        <div className="relative w-full shrink-0 overflow-hidden bg-neutral-950 aspect-square">
          <div className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform group-hover/card:scale-[1.02] motion-reduce:scale-100 motion-reduce:transition-none">
            <Image
              src={src}
              alt={alt ?? ""}
              fill
              quality={88}
              className={`object-cover object-center ${imageClassName ?? ""}`}
              sizes={imageSizes}
              priority={priority}
            />
          </div>
        </div>
      ) : (
        <div className="relative w-full shrink-0 overflow-hidden bg-neutral-950 aspect-video min-h-[220px] sm:min-h-[280px]">
          <div className="absolute inset-0 transition-transform duration-700 ease-out will-change-transform group-hover/card:scale-[1.02] motion-reduce:scale-100 motion-reduce:transition-none">
            <Image
              src={src}
              alt={alt ?? ""}
              fill
              quality={88}
              className={`object-cover object-center ${imageClassName ?? ""}`}
              sizes={imageSizes}
              priority={priority}
            />
          </div>
        </div>
      )}

      <div
        className={`flex min-h-0 min-w-0 flex-1 flex-col justify-start gap-4 border-t px-4 py-6 sm:gap-5 sm:px-7 sm:py-9 ${EDGE} ${splitWide ? "md:col-span-4 md:justify-center md:border-l md:border-t-0 md:py-8 lg:py-10" : ""}`}
      >
        <SetupEditorialCopy eyebrow={eyebrow} hook={hook} rest={rest} />
      </div>
    </article>
  );
}
