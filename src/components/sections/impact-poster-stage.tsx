"use client";

import Image from "next/image";

type ImpactPosterStageProps = {
  id?: string;
  /** En transición se usan clases .impact-ent-* para el timeline GSAP. */
  variant: "document" | "transition";
};

export function ImpactPosterStage({ id, variant }: ImpactPosterStageProps) {
  const isDoc = variant === "document";
  const Root = isDoc ? "section" : "div";

  return (
    <Root
      id={id}
      className={`impact-black-section brutal-section ${isDoc ? "border-t-2 border-black" : "impact-black-section--transition"}`}
    >
      <div className="impact-pink-stage">
        <div className="impact-pink-stage__left">
          <h2 className="impact-pink-stage__head m-0 p-0">
            <span className={`impact-brutal-headline font-display block text-black ${isDoc ? "" : "impact-ent-tu-idea"}`}>
              TU IDEA
            </span>
            <span className="idea-script-wrap impact-ent-lista relative z-2 -mt-[0.06em] block origin-left -rotate-[2.5deg] translate-x-[0.04em] md:-mt-[0.08em] md:translate-x-[0.06em]">
              <span className={`idea-script-type font-accent ${isDoc ? "" : "impact-ent-lista-inner"}`}>lista hoy</span>
            </span>
          </h2>

          <div className="impact-sin-vueltas-box impact-ent-box idea-fade mt-10 max-w-[min(100%,52ch)] rounded-xl border-2 border-dashed border-black p-4 md:mt-12 md:rounded-2xl md:p-5 lg:mt-14">
            <p className="text-[0.58rem] font-bold uppercase tracking-[0.18em] text-black">SIN VUELTAS</p>
            <p className="mt-2 font-serif text-base italic leading-snug text-black md:text-lg">
              No necesitás seis meses de reuniones.
            </p>
            <p className="mt-3 text-[0.62rem] font-bold uppercase leading-snug tracking-[0.065em] text-black md:text-[0.68rem]">
              SI YA TENÉS MARCA, TEXTOS E IMÁGENES, LO BAJAMOS A TIERRA RÁPIDO Y CON CRITERIO.
            </p>
          </div>
        </div>

        <div className="impact-pink-stage__right">
          <div
            className={`impact-pink-stage__sticker idea-sticker impact-ent-sticker ${isDoc ? "sticker19-loop" : ""}`}
          >
            <Image
              src="/brand/stickers/STICKER19.png"
              alt="Las Girls — sticker con notebook"
              width={1040}
              height={720}
              className="impact-pink-stage__sticker-img h-full w-auto max-w-[min(92%,520px)] object-contain object-[100%_100%]"
              priority={false}
            />
          </div>
        </div>
      </div>
    </Root>
  );
}
