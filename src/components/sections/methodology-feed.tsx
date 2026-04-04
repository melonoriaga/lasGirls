import Image from "next/image";
import { homeContent } from "@/content/site/home";

const NOISE_BG = "url('https://grainy-gradients.vercel.app/noise.svg')";

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
    title: "DIAGNÓSTICO\nY ACOMPAÑA\nMIENTO\nINICIAL",
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
    title: "DEFINICIÓN\nDE NECESI\nDADES\nREALES",
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
    title: "ROADMAP\nA MEDI\nDA",
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

export function MethodologyFeed() {
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
          {CARD_SPECS.map((card) => (
            <article
              key={card.indexLabel}
              className="group/meth-post relative rounded-[18px] motion-reduce:transition-none"
            >
              <div
                className="relative flex aspect-4/5 w-full flex-col overflow-hidden rounded-[18px] border-2 border-black/80 shadow-[0_10px_24px_rgba(17,17,17,0.14)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hover:scale-[1.02]"
                style={{ backgroundColor: card.cardBg }}
              >
                <span
                  className={`pointer-events-none absolute z-0 font-black leading-none text-black/[0.07] ${card.watermarkClass}`}
                  aria-hidden
                >
                  {card.indexLabel}
                </span>

                <div
                  className="pointer-events-none absolute inset-0 z-1 bg-repeat opacity-[0.14] mix-blend-multiply"
                  style={{ backgroundImage: NOISE_BG }}
                  aria-hidden
                />

                <div className="pointer-events-none absolute inset-0 z-10" aria-hidden>
                  {card.stickers.map((st, j) => (
                    <StickerDecor key={`${card.indexLabel}-${j}`} spec={st} />
                  ))}
                </div>

                <span className="absolute right-3 top-3 z-20 font-mono text-[10px] font-bold tabular-nums uppercase tracking-[0.18em] text-black/45">
                  {card.indexLabel}
                </span>

                <div
                  className="relative z-20 flex min-h-0 flex-1 flex-col px-5 pb-6 pt-7 md:px-6 md:pb-7 md:pt-8"
                  style={{ backgroundColor: "transparent" }}
                >
                  <header className="flex-[0_0_50%] flex flex-col justify-start pr-1">
                    <h3
                      className="whitespace-pre-line font-display text-left text-[clamp(2.35rem,12vw,4rem)] font-black uppercase leading-[1] tracking-[-0.01em] text-black sm:text-[clamp(2.65rem,9vw,4.4rem)] lg:text-[clamp(3rem,4.7vw,4.9rem)] xl:text-[clamp(3.3rem,4.2vw,5.2rem)]"
                    >
                      {card.title}
                    </h3>
                  </header>

                  <div className={`relative z-20 mt-1.5 flex min-h-0 flex-1 flex-col justify-start ${card.bodyShellClass}`}>
                    <p className="max-w-76 text-left text-[1rem] font-medium leading-[1.45] text-black/88 md:text-[1.125rem] lg:text-[1.18rem]">
                      {card.body}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
