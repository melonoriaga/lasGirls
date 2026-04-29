"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDictionary } from "@/i18n/locale-provider";

function FilmGrainLayers() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.15] mix-blend-soft-light bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-tr from-black/8 via-transparent to-black/4" aria-hidden />
    </>
  );
}

const PAPER_BG = "bg-[#f4ede6]";
const DECO_ASSETS = [
  "/DECO/deco001.png",
  "/DECO/deco002.png",
  "/DECO/deco003.png",
  "/DECO/deco004.png",
  "/DECO/deco005.png",
  "/DECO/deco006.png",
] as const;

const JEAN_IMG = "/brand/girls/jean-byn2.jpeg";
const MEL_IMG = "/brand/girls/mel-byn2.jpeg";

const FOUNDER_PHOTO_SHELL = "relative aspect-square w-full overflow-hidden rounded-none bg-neutral-950";

const DUO_IMG_SIZES =
  "(min-width:1536px) min(520px, 34vw), (min-width:1024px) min(340px, 23vw), 100vw";

const bleedInset =
  "w-full min-w-0 max-w-[100vw] px-4 pl-[max(1rem,env(safe-area-inset-left,0px))] pr-[max(1rem,env(safe-area-inset-right,0px))] sm:px-[clamp(1.25rem,5vw,4rem)]";

const EDITORIAL_GRID_SHELL =
  "grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-none border border-black/12 bg-black/10";

/** Tags tipo píldora (duo, caps, etc.) */
const TAG_PILL =
  "rounded-full border border-black/14 bg-black/[0.03] px-4 py-1.5 font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-black/85 sm:text-[9.5px]";

type TextSeg = Readonly<{ text: string; italic?: boolean }>;

function DecoSquareFigure({
  src,
  alt,
  sizes,
  priority,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
}) {
  return (
    <figure className="relative aspect-square min-h-0 w-full overflow-hidden bg-neutral-900">
      <Image
        src={src}
        alt={alt}
        fill
        quality={88}
        className="object-cover object-center"
        sizes={sizes ?? "(min-width:1024px) 24vw, 100vw"}
        priority={priority}
      />
      <FilmGrainLayers />
    </figure>
  );
}

/** Cover en columna: object-cover; en desktop la columna crece con la fila (no 1:1). */
function DecoCoverFigure({
  src,
  alt,
  sizes,
}: {
  src: string;
  alt: string;
  sizes?: string;
}) {
  return (
    <figure className="relative isolate min-h-[min(260px,48vh)] w-full flex-1 overflow-hidden bg-neutral-900 md:min-h-0 lg:rounded-none">
      <Image
        src={src}
        alt={alt}
        fill
        quality={88}
        className="object-cover object-center"
        sizes={sizes ?? "(min-width:1024px) min(400px, 42vw), 100vw"}
      />
      <FilmGrainLayers />
    </figure>
  );
}

function IntroParagraphs({ segments }: { segments: readonly (readonly TextSeg[])[] }) {
  return (
    <>
      {segments.map((parts, i) => (
        <p
          key={`intro-${String(i)}`}
          className={`m-0 max-w-none text-[1rem] leading-[1.75] md:text-[1.1rem] ${i >= 3 ? "md:max-w-none" : ""}`}
        >
          {parts.map((part, j) =>
            part.italic ? (
              <em key={`${i}-${j}`} className="italic text-black/92">
                {part.text}
              </em>
            ) : (
              <span key={`${i}-${j}`}>{part.text}</span>
            ),
          )}
        </p>
      ))}
    </>
  );
}

function CapabilityPills({ bullets }: { bullets: readonly string[] }) {
  return (
    <ul role="list" className="mt-10 flex flex-wrap gap-2.5 md:mt-14">
      {bullets.map((label, i) => (
        <li key={`${label}-${i}`} className={TAG_PILL}>
          <span aria-hidden className="mr-1.5 font-mono text-[9px] text-black/35">
            {String(i + 1).padStart(2, "0")}
          </span>
          {label}
        </li>
      ))}
    </ul>
  );
}

function StickerPhrase({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex max-w-full flex-wrap rounded-2xl border border-black/16 bg-[#efe7dd]/90 px-4 py-2.5 font-display text-[0.72rem] font-semibold italic leading-snug tracking-wide text-black/90 wrap-anywhere sm:text-[0.78rem] sm:tracking-[0.06em] md:px-5 md:py-3">
      {children}
    </span>
  );
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-black/72">{children}</p>
  );
}

function AboutSplitDecoSection({
  decoIndex,
  children,
  imageFit = "square",
}: {
  decoIndex: number;
  children: React.ReactNode;
  /** `cover`: recorte pantalla completa en la columna (sin forzar aspect-square). */
  imageFit?: "square" | "cover";
}) {
  const src = DECO_ASSETS[decoIndex % DECO_ASSETS.length];
  const imageCol =
    imageFit === "cover"
      ? "flex min-h-0 flex-col md:col-span-5 md:h-full md:self-stretch"
      : "min-h-0 md:col-span-5";

  return (
    <section className={`about-rise ${bleedInset} py-16 md:py-24`}>
      <div className={`${EDITORIAL_GRID_SHELL} md:grid-cols-12 md:items-stretch`}>
        <div className={imageCol}>
          {imageFit === "square" ? (
            <DecoSquareFigure
              src={src}
              alt="Las Girls — imagen"
              sizes="(min-width:1024px) min(380px, 40vw), 100vw"
            />
          ) : (
            <DecoCoverFigure
              src={src}
              alt="Las Girls — imagen"
              sizes="(min-width:1024px) min(400px, 42vw), 100vw"
            />
          )}
        </div>
        <div className={`${PAPER_BG} min-h-0 px-6 py-9 sm:px-8 sm:py-10 md:col-span-7 md:px-11 md:py-14`}>{children}</div>
      </div>
    </section>
  );
}

export function AboutPageContent() {
  const a = useDictionary().aboutPage;
  const rootRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || typeof window === "undefined") return undefined;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return undefined;
    }

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.utils.toArray<Element>(root.querySelectorAll(".about-rise")).forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: 28 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            delay: Math.min(i * 0.04, 0.48),
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 92%", once: true },
          },
        );
      });
    }, rootRef);

    return () => {
      ctx.revert();
    };
  }, []);

  const introSeg = a.intro.segmented;

  return (
    <article
      ref={rootRef}
      className={`relative w-full min-w-0 overflow-x-clip border-y-2 border-black text-black sm:border-x ${PAPER_BG}`}
    >
      {/* —— 1. Hero —— */}
      <section
        className={`about-rise relative flex min-h-svh flex-col justify-center ${bleedInset} pb-16 pt-[max(4.5rem,env(safe-area-inset-top))] md:py-28`}
      >
        <SectionEyebrow>{a.hero.eyebrow}</SectionEyebrow>
        <h1 className="mt-10 max-w-full wrap-anywhere font-display text-[clamp(1.85rem,8.2vw,8.85rem)] font-black uppercase leading-[0.93] tracking-[-0.02em] sm:mt-12 md:mt-16 lg:text-[clamp(2.25rem,9.5vw,8.85rem)]">
          <span className="block">{a.hero.headlineLine1}</span>
          <span className="mt-2 block sm:mt-3">{a.hero.headlineLine2}</span>
        </h1>
        <p className="mt-8 max-w-4xl text-[1rem] leading-[1.62] md:mt-12 md:text-[1.125rem] md:leading-relaxed">{a.hero.subtitle}</p>
        <div className="mt-10 grid max-w-3xl gap-4 md:mt-14">
          <p className="text-[0.94rem] font-semibold uppercase leading-snug tracking-[0.02em] text-black sm:text-[1.02rem] md:text-[1.08rem]">
            {a.hero.short1}
          </p>
          <p className="text-[0.94rem] font-semibold uppercase leading-snug tracking-[0.02em] text-black sm:text-[1.02rem] md:text-[1.08rem]">
            {a.hero.short2}
          </p>
        </div>
      </section>

      {/* —— 2. Identidad — imagen 01 | texto | imagen 02 (1:1) —— */}
      <section className={`about-rise ${bleedInset} py-14 md:py-20 lg:py-24`}>
        <div className={`${EDITORIAL_GRID_SHELL} lg:grid-cols-12 lg:items-stretch`}>
          <div className="min-h-0 lg:col-span-3">
            <DecoSquareFigure
              src={DECO_ASSETS[0]}
              alt="Las Girls — deco 01"
              sizes="(min-width:1024px) min(280px, 22vw), 100vw"
              priority
            />
          </div>
          <div
            className={`${PAPER_BG} flex min-h-0 flex-col justify-center gap-6 border-t border-black/10 px-6 py-9 sm:px-8 sm:py-10 lg:col-span-6 lg:border-x lg:border-t-0 lg:px-10 lg:py-12`}
          >
            <IntroParagraphs segments={introSeg} />
          </div>
          <div className="min-h-0 lg:col-span-3">
            <DecoSquareFigure
              src={DECO_ASSETS[1]}
              alt="Las Girls — deco 02"
              sizes="(min-width:1024px) min(280px, 22vw), 100vw"
            />
          </div>
        </div>
      </section>

      {/* —— 3. Las dos caras —— */}
      <section className={`about-rise w-full pb-14 pt-8 md:pb-24 md:pt-14`}>
        <div className={bleedInset}>
          <SectionEyebrow>{a.duo.eyebrow}</SectionEyebrow>
        </div>
        <div className={`${bleedInset} mt-8 sm:mt-10`}>
          <div className={`${EDITORIAL_GRID_SHELL} lg:items-stretch`}>
            <article className={`${PAPER_BG} min-h-0 min-w-0`}>
              <div
                className={`grid grid-cols-1 items-stretch gap-0 divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0 ${PAPER_BG}`}
              >
                <div className="relative self-stretch p-0 md:col-span-1">
                  <div className={FOUNDER_PHOTO_SHELL}>
                    <Image
                      src={JEAN_IMG}
                      alt="Jean · Las Girls"
                      fill
                      quality={88}
                      className="object-cover object-center"
                      sizes={DUO_IMG_SIZES}
                      priority
                    />
                    <FilmGrainLayers />
                  </div>
                </div>
                <div className="flex min-h-0 flex-col gap-4 p-6 sm:p-8 md:col-span-2">
                  <h2 className="font-display text-[clamp(1.85rem,4.5vw,2.75rem)] font-black uppercase leading-tight">{a.duo.jean.title}</h2>
                  <StickerPhrase>{a.duo.jean.sticker}</StickerPhrase>
                  <p className="max-w-xl text-[0.94rem] leading-[1.7] text-black/92 md:text-[1.02rem]">{a.duo.jean.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {a.duo.jean.tags.map((tag: string) => (
                      <li key={tag} className={TAG_PILL}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </article>

            <article className={`${PAPER_BG} min-h-0 min-w-0`}>
              <div
                className={`grid grid-cols-1 items-stretch gap-0 divide-y divide-black/10 md:grid-cols-3 md:divide-x md:divide-y-0 ${PAPER_BG}`}
              >
                <div className={`order-2 flex min-h-0 flex-col gap-4 p-6 sm:p-8 md:order-1 md:col-span-2`}>
                  <h2 className="font-display text-[clamp(1.85rem,4.5vw,2.75rem)] font-black uppercase leading-tight">{a.duo.mel.title}</h2>
                  <StickerPhrase>{a.duo.mel.sticker}</StickerPhrase>
                  <p className="max-w-xl text-[0.94rem] leading-[1.7] text-black/92 md:text-[1.02rem]">{a.duo.mel.body}</p>
                  <ul className="mt-4 flex flex-wrap gap-2">
                    {a.duo.mel.tags.map((tag: string) => (
                      <li key={tag} className={TAG_PILL}>
                        {tag}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="relative order-1 self-stretch md:order-2 md:col-span-1">
                  <div className={FOUNDER_PHOTO_SHELL}>
                    <Image
                      src={MEL_IMG}
                      alt="Mel · Las Girls"
                      fill
                      quality={88}
                      className="object-cover object-center"
                      sizes={DUO_IMG_SIZES}
                    />
                    <FilmGrainLayers />
                  </div>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* —— 4. El match · imagen 03 —— */}
      <AboutSplitDecoSection decoIndex={2}>
        <h2 className="wrap-anywhere font-display text-[clamp(1.55rem,6.8vw,4.85rem)] font-black uppercase leading-[0.96] tracking-[-0.025em] sm:text-[clamp(1.9rem,7.5vw,4.85rem)]">
          {a.match.title}
        </h2>
        <div className="mt-8 max-w-4xl space-y-7 border-l-2 border-black/18 pl-5 sm:space-y-8 sm:border-l-[3px] sm:pl-8 md:mt-10">
          {a.match.paragraphs.map((paragraph: string, i: number) => (
            <p key={String(i)} className="m-0 text-[1rem] leading-[1.75] md:text-[1.1rem]">
              {paragraph}
            </p>
          ))}
        </div>
      </AboutSplitDecoSection>

      {/* —— 5. Historia · imagen 04 —— */}
      <AboutSplitDecoSection decoIndex={3} imageFit="cover">
        <h2 className="wrap-anywhere font-display text-[clamp(1.75rem,7.5vw,5.25rem)] font-black uppercase leading-[0.93] md:text-[clamp(2rem,8.5vw,5.25rem)]">
          {a.story.title}
        </h2>
        <ol className={`${EDITORIAL_GRID_SHELL} mt-10 md:mt-11`}>
          {a.story.entries.map((entry: { heading: string; body: string }, i: number) => (
            <li
              key={String(i)}
              className={`${PAPER_BG} grid gap-4 px-4 py-7 wrap-anywhere sm:gap-5 sm:px-6 md:grid-cols-[minmax(112px,0.95fr)_3fr] md:gap-10 md:px-8 md:py-11`}
            >
              <span className="block font-mono text-[9px] font-bold uppercase leading-snug tracking-[0.2em] text-black/72 sm:text-[10px] sm:tracking-[0.22em] md:inline md:text-[11px]">
                {entry.heading}
              </span>
              <p className="m-0 text-[0.98rem] leading-[1.72] md:text-[1.05rem]">{entry.body}</p>
            </li>
          ))}
        </ol>
      </AboutSplitDecoSection>

      {/* —— 6. Caps · imagen 05 —— */}
      <AboutSplitDecoSection decoIndex={4}>
        <h2 className="wrap-anywhere font-display text-[clamp(1.65rem,7.8vw,4.85rem)] font-black uppercase leading-[0.93] md:max-w-5xl md:text-[clamp(1.9rem,8vw,4.85rem)]">
          {a.caps.title}
        </h2>
        <p className="mt-8 max-w-3xl text-[1rem] leading-relaxed md:mt-9 md:text-[1.12rem]">{a.caps.lead}</p>
        <CapabilityPills bullets={a.caps.bullets} />
        <p className="mt-10 max-w-3xl text-[0.92rem] font-semibold uppercase leading-snug tracking-[0.04em] text-black/92 md:mt-12 md:text-[0.96rem]">
          {a.caps.closer}
        </p>
      </AboutSplitDecoSection>

      {/* —— 7. Equipo · imagen 06 —— */}
      <AboutSplitDecoSection decoIndex={5}>
        <h2 className="wrap-anywhere font-display text-[clamp(1.85rem,8vw,5.35rem)] font-black uppercase leading-[0.9]">{a.squad.title}</h2>
        <div className="mt-9 max-w-4xl space-y-7 md:mt-11">
          {a.squad.paragraphs.map((p: string, i: number) => (
            <p key={String(i)} className="m-0 text-[1rem] leading-[1.8] md:text-[1.09rem]">
              {p}
            </p>
          ))}
        </div>
        <p className="mt-10 md:mt-12">
          <Link
            href="/team"
            className="inline-flex items-center gap-2 rounded-full border border-black/18 bg-black/2 px-5 py-2.5 font-mono text-[10px] font-semibold uppercase tracking-[0.22em] text-black/80 transition hover:border-black/30 hover:bg-black/4"
          >
            {a.squad.teamCta}
            <span aria-hidden className="text-black/40">
              →
            </span>
          </Link>
        </p>
      </AboutSplitDecoSection>

      {/* —— 8. Filosofía —— */}
      <section className={`about-rise ${bleedInset} pb-20 pt-8 md:pb-28 md:pt-12`}>
        <h2 className="wrap-anywhere font-display text-[clamp(1.85rem,7.8vw,5rem)] font-black uppercase leading-[0.88]">{a.philosophy.title}</h2>
        <div className="mt-12 max-w-3xl space-y-6 border border-black/12 px-4 py-8 sm:px-8 md:mt-16 md:px-12 md:py-14">
          {a.philosophy.lines.map((line: string, i: number) => (
            <p
              key={String(i)}
              className={`text-[1.05rem] font-semibold leading-snug tracking-[0.04em] text-black md:text-[1.12rem] ${i === 2 ? "normal-case md:leading-relaxed md:tracking-normal" : "uppercase"}`}
            >
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* —— 9. Cierre CTA —— */}
      <section className={`about-rise ${bleedInset} pb-[max(7rem,env(safe-area-inset-bottom))] pt-12 md:pb-36 md:pt-20`}>
        <div role="presentation" className="h-px w-full bg-black/88" />
        <div className="mt-14 flex flex-col gap-10 md:mt-20 md:flex-row md:items-end md:justify-between md:gap-16">
          <div className="min-w-0 max-w-3xl space-y-6">
            <h2 className="wrap-anywhere font-display text-[clamp(1.75rem,8vw,5.85rem)] font-black uppercase leading-[0.9] md:text-[clamp(2.1rem,8.5vw,5.85rem)]">
              {a.finale.title}
            </h2>
            <p className="max-w-xl text-[1.05rem] leading-[1.65] md:text-[1.2rem]">{a.finale.lead}</p>
          </div>
          <Link
            href="/contact"
            className="hero-cta hero-cta--dark inline-flex w-full shrink-0 justify-center text-center no-underline sm:w-auto md:self-end"
          >
            {a.finale.cta}
          </Link>
        </div>
      </section>
    </article>
  );
}
