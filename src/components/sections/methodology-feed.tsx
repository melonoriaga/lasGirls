"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { homeContent } from "@/content/site/home";

const NOISE_BG = "url('https://grainy-gradients.vercel.app/noise.svg')";
const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

const ASSETS = {
  s1: "/brand/stickers/sticker-1.png",
  s10: "/brand/stickers/STICKER10.png",
  s11: "/brand/stickers/STICKER11.png",
  s12: "/brand/stickers/STICKER12.png",
  s13: "/brand/stickers/STICKER13.png",
} as const;

type StickerSpec = {
  src: string;
  w: number;
  h: number;
  className: string;
};

type FeedCardSpec = {
  indexLabel: string;
  /** Cortes de línea intencionales (editorial). */
  title: string;
  body: string;
  cardBg: string;
  /** Fondo del bloque tipo “recorte”. */
  cutBg: string;
  /** Desplazamiento del bloque cuerpo vs título. */
  bodyShellClass: string;
  /** Número gigante de fondo: posición y escala variables. */
  watermarkClass: string;
  stickers: StickerSpec[];
};

const blocks = homeContent.methodology.blocks;

const CARD_SPECS: FeedCardSpec[] = [
  {
    indexLabel: "01",
    title: "DIAGNÓSTICO Y\nACOMPAÑAMIENTO\nINICIAL",
    body: blocks[0]?.description ?? "",
    cardBg: "#F3EEE8",
    cutBg: "#E5DDD3",
    bodyShellClass: "ml-0 mr-3 md:mr-4",
    watermarkClass:
      "left-[-12%] top-[8%] translate-x-0 translate-y-0 text-left font-display text-[clamp(7rem,32vw,13rem)]",
    stickers: [
      {
        src: ASSETS.s11,
        w: 1026,
        h: 588,
        className: "top-[1%] left-[-5%] w-[92%] max-w-[35rem] rotate-[10deg] opacity-50",
      },
      {
        src: ASSETS.s1,
        w: 732,
        h: 722,
        className: "bottom-[20%] right-[-8%] w-[88%] max-w-[18rem] -rotate-[10deg] opacity-50",
      },
      {
        src: ASSETS.s12,
        w: 710,
        h: 774,
        className: "bottom-[0%] left-[6%] w-[78%] max-w-[14rem] rotate-[5deg] opacity-50",
      },
    ],
  },
  {
    indexLabel: "02",
    title: "DEFINICIÓN\nDE NECESIDADES\nREALES",
    body: blocks[1]?.description ?? "",
    cardBg: "#EFE7DD",
    cutBg: "#E3DBD1",
    bodyShellClass: "ml-4 mr-0 md:ml-5",
    watermarkClass:
      "right-[-18%] bottom-[12%] left-auto top-auto translate-x-0 translate-y-0 text-right font-display text-[clamp(6.25rem,28vw,11.5rem)]",
    stickers: [
      {
        src: ASSETS.s12,
        w: 710,
        h: 774,
        className: "top-[1%] right-[-5%] w-[72%] max-w-[35rem] rotate-[10deg] opacity-70",
      },
      {
        src: ASSETS.s10,
        w: 707,
        h: 854,
        className: "bottom-[-18%] left-[-20%] w-[92%] max-w-[16rem] -rotate-[7deg] opacity-90",
      },
    ],
  },
  {
    indexLabel: "03",
    title: "ROADMAP\nA MEDIDA",
    body: blocks[2]?.description ?? "",
    cardBg: "#F5EFE6",
    cutBg: "#E8E1D7",
    bodyShellClass: "ml-1 mr-5 md:ml-2 md:mr-6",
    watermarkClass:
      "left-1/2 top-[48%] -translate-x-[38%] -translate-y-1/2 text-center font-display text-[clamp(7.5rem,34vw,14rem)]",
    stickers: [
      {
        src: ASSETS.s13,
        w: 894,
        h: 401,
        className: "top-[10%] right-[-8%] w-[95%] max-w-[26rem] -rotate-[5deg] opacity-85",
      },
      {
        src: ASSETS.s11,
        w: 1026,
        h: 588,
        className: "bottom-[-4%] left-[-2%] w-[92%] max-w-[30rem] rotate-[9deg] opacity-55",
      },
    ],
  },
];

function StickerDecor({ spec }: { spec: StickerSpec }) {
  return (
    <div
      className={`pointer-events-none absolute z-1 select-none transition-transform duration-500 ease-out group-hover/meth-post:translate-y-[-3px] ${spec.className}`}
      aria-hidden
    >
      <Image
        src={spec.src}
        alt=""
        width={spec.w}
        height={spec.h}
        className="h-auto w-full object-contain drop-shadow-[0_8px_14px_rgba(17,17,17,0.12)]"
        sizes="120px"
      />
    </div>
  );
}

type ScrambleSegment =
  | { kind: "br"; key: number }
  | { kind: "text"; small: boolean; parts: { idx: number; char: string }[] };

function buildScrambleSegments(text: string, smallerSubstring?: string): ScrambleSegment[] {
  const chars = Array.from(text);
  const range =
    smallerSubstring && text.includes(smallerSubstring)
      ? { start: text.indexOf(smallerSubstring), end: text.indexOf(smallerSubstring) + smallerSubstring.length }
      : null;

  const segs: ScrambleSegment[] = [];
  const buf: { idx: number; char: string }[] = [];
  let bufSmall: boolean | null = null;

  const flush = () => {
    if (buf.length) {
      segs.push({ kind: "text", small: bufSmall ?? false, parts: [...buf] });
      buf.length = 0;
      bufSmall = null;
    }
  };

  for (let idx = 0; idx < chars.length; idx++) {
    const c = chars[idx];
    if (c === "\n") {
      flush();
      segs.push({ kind: "br", key: idx });
      continue;
    }
    const small = !!(range && idx >= range.start && idx < range.end);
    if (buf.length > 0 && small !== bufSmall) flush();
    buf.push({ idx, char: c });
    bufSmall = small;
  }
  flush();
  return segs;
}

function ScrambleScrollTitle({
  text,
  className,
  smallerSubstring,
  smallerClassName = "inline text-[0.74em] sm:text-[0.8em] lg:text-[0.86em]",
}: {
  text: string;
  className: string;
  smallerSubstring?: string;
  smallerClassName?: string;
}) {
  const rootRef = useRef<HTMLHeadingElement | null>(null);
  const tweenRef = useRef<gsap.core.Tween | null>(null);
  const spansRef = useRef<(HTMLSpanElement | null)[]>([]);

  const segments = useMemo(
    () => buildScrambleSegments(text, smallerSubstring),
    [text, smallerSubstring],
  );

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const spans = spansRef.current.filter((node): node is HTMLSpanElement => Boolean(node));
    if (!rootRef.current || spans.length === 0) return;

    const finals = spans.map((span) => span.dataset.finalChar ?? "");

    const paintFinal = () => {
      spans.forEach((span, idx) => {
        span.textContent = finals[idx];
      });
    };

    const paintFrame = (progress: number) => {
      const reveal = Math.floor(progress * finals.length);
      spans.forEach((span, idx) => {
        span.textContent =
          idx <= reveal
            ? finals[idx]
            : SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)];
      });
    };

    paintFinal();

    const runScramble = () => {
      tweenRef.current?.kill();
      const state = { progress: 0 };
      tweenRef.current = gsap.to(state, {
        progress: 1,
        duration: 1.05,
        ease: "power2.out",
        onStart: () => paintFrame(0),
        onUpdate: () => paintFrame(state.progress),
        onComplete: paintFinal,
      });
    };

    const trigger = ScrollTrigger.create({
      trigger: rootRef.current,
      start: "top 85%",
      onEnter: runScramble,
      onEnterBack: runScramble,
    });

    return () => {
      tweenRef.current?.kill();
      trigger.kill();
    };
  }, [text, smallerSubstring]);

  return (
    <h3 ref={rootRef} className={className} aria-label={text.replace(/\n/g, " ")}>
      {segments.map((seg, segIdx) =>
        seg.kind === "br" ? (
          <br key={`break-${seg.key}`} />
        ) : seg.small ? (
          <span key={`seg-s-${segIdx}`} className={smallerClassName}>
            {seg.parts.map(({ idx, char }) => (
              <span
                key={`${char}-${idx}`}
                ref={(node) => {
                  spansRef.current[idx] = node;
                }}
                data-final-char={char}
                className="inline"
              >
                {char}
              </span>
            ))}
          </span>
        ) : (
          <span key={`seg-n-${segIdx}`} className="contents">
            {seg.parts.map(({ idx, char }) => (
              <span
                key={`${char}-${idx}`}
                ref={(node) => {
                  spansRef.current[idx] = node;
                }}
                data-final-char={char}
                className="inline"
              >
                {char}
              </span>
            ))}
          </span>
        ),
      )}
    </h3>
  );
}

export function MethodologyFeed() {
  const [activeCard, setActiveCard] = useState<string | null>(null);

  return (
    <section
      id="metodologia"
      className="border-t-2 border-black bg-[#ff6faf] px-4 py-16 sm:px-6 md:py-20 lg:px-10 lg:py-24"
    >
      <div className="mx-auto max-w-[1600px]">
        <header className="mb-10 max-w-3xl md:mb-14 lg:mb-16">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-black/65 md:text-[11px]">feed / proceso</p>
          <h2 className="mt-3 font-display text-[clamp(2.5rem,9vw,4.75rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-black">
            TRABAJAR CON NOSOTRAS
          </h2>
          <p className="font-accent mt-3 text-[clamp(1.65rem,4.5vw,2.75rem)] leading-[0.98] text-black">es así de simple.</p>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 lg:gap-10 xl:gap-16">
          {CARD_SPECS.map((card) => {
            const isFocused = activeCard === card.indexLabel;
            const isMuted = activeCard !== null && !isFocused;

            return (
              <article
                key={card.indexLabel}
                onMouseEnter={() => setActiveCard(card.indexLabel)}
                onMouseLeave={() => setActiveCard(null)}
                className={`group/meth-post relative rounded-[18px] transition-all duration-500 ease-out motion-reduce:transition-none ${
                  isFocused
                    ? "z-30 lg:scale-[1.1]"
                    : isMuted
                      ? "z-0 lg:scale-[0.92] lg:opacity-65"
                      : "z-10 lg:scale-100 lg:opacity-100"
                }`}
              >
              <div
                className={`relative flex aspect-4/5 w-full flex-col overflow-hidden rounded-[18px] border-2 border-black/80 transition-all duration-500 ease-out motion-reduce:transition-none ${
                  isFocused
                    ? "shadow-[0_24px_48px_rgba(17,17,17,0.28)]"
                    : "shadow-[0_10px_24px_rgba(17,17,17,0.14)]"
                }`}
                style={{ backgroundColor: card.cardBg }}
              >
                <span
                  className={`pointer-events-none absolute z-0 font-black leading-none text-black/[0.07] transition-all duration-500 ease-out ${card.watermarkClass} ${
                    isFocused ? "scale-[1.08] text-black/10" : isMuted ? "scale-95 text-black/4" : "scale-100"
                  }`}
                  aria-hidden
                >
                  {card.indexLabel}
                </span>

                <div
                  className="pointer-events-none absolute inset-0 z-1 bg-repeat opacity-[0.14] mix-blend-multiply"
                  style={{ backgroundImage: NOISE_BG }}
                  aria-hidden
                />

                <div
                  className={`pointer-events-none absolute inset-0 z-10 transition-all duration-500 ease-out ${
                    isFocused ? "scale-[1.06]" : isMuted ? "scale-95 opacity-70" : "scale-100 opacity-100"
                  }`}
                  aria-hidden
                >
                  {card.stickers.map((st, j) => (
                    <StickerDecor key={`${card.indexLabel}-${j}`} spec={st} />
                  ))}
                </div>

                <span
                  className={`absolute right-3 top-3 z-20 font-mono text-[10px] font-bold tabular-nums uppercase tracking-[0.18em] transition-all duration-500 ${
                    isFocused ? "text-black/70" : "text-black/45"
                  }`}
                >
                  {card.indexLabel}
                </span>

                <div
                  className={`relative z-20 flex min-h-0 flex-1 flex-col px-5 pb-6 pt-7 transition-all duration-500 md:px-6 md:pb-7 md:pt-8 ${
                    isFocused ? "translate-y-[-3px]" : isMuted ? "translate-y-[3px]" : "translate-y-0"
                  }`}
                  style={{ backgroundColor: "transparent" }}
                >
                  <header className="flex-[0_0_50%] flex flex-col justify-start pr-1">
                    <ScrambleScrollTitle
                      text={card.title}
                      smallerSubstring={card.indexLabel === "01" ? "ACOMPAÑAMIENTO" : undefined}
                      className={`hyphens-none whitespace-pre-line break-normal text-left font-display text-[clamp(2.35rem,12vw,4rem)] font-black uppercase leading-[1.02] tracking-[-0.01em] transition-all duration-500 sm:text-[clamp(2.65rem,9vw,4.4rem)] lg:text-[clamp(3rem,4.7vw,4.9rem)] xl:text-[clamp(3.3rem,4.2vw,5.2rem)] ${
                        isFocused ? "text-black drop-shadow-[0_6px_10px_rgba(17,17,17,0.14)]" : "text-black"
                      }`}
                    />
                  </header>

                  <div className={`relative z-20 mt-1.5 flex min-h-0 flex-1 flex-col justify-start ${card.bodyShellClass}`}>
                    <p
                      className={`max-w-76 text-left text-[1rem] font-medium leading-[1.45] transition-all duration-500 md:text-[1.125rem] lg:text-[1.18rem] ${
                        isFocused ? "text-black/95" : isMuted ? "text-black/70" : "text-black/88"
                      }`}
                    >
                      {card.body}
                    </p>
                  </div>
                </div>
              </div>
            </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
