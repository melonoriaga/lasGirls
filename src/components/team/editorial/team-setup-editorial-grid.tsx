"use client";

import { SetupCard } from "@/components/team/editorial/setup-card";
import { TEAM_SETUP_IMAGES } from "@/content/teamSetup/team-setup-images";

/** Fila Frontend (12 cols) */
const SIZES_GRID_FE_ROW =
  "(min-width:1920px) min(1400px, 88vw), (min-width:1536px) min(1100px, 90vw), (min-width:1024px) 92vw, 100vw";

/** Fotos mitad fila (~6 cols) */
const SIZES_GRID_HALF =
  "(min-width:1920px) min(800px, 46vw), (min-width:1536px) min(660px, 48vw), (min-width:1024px) 48vw, 100vw";

export type TeamSetupGridCopy = {
  gridEyebrow: string;
  gridFrontend: { eyebrow: string; hook: string; rest: readonly string[] };
  gridBackend: { eyebrow: string; hook: string; rest: readonly string[] };
  gridPm: { eyebrow: string; hook: string; rest: readonly string[] };
  gridVideo: { eyebrow: string; hook: string; rest: readonly string[] };
  gridFinances: { eyebrow: string; hook: string; rest: readonly string[] };
  gridSocial: { eyebrow: string; hook: string; rest: readonly string[] };
  quoteBlockLines: readonly string[];
};

/**
 * 1 FE · 2 Backend + Operaciones · 3 Video + Finanzas · 4 Redes + quote sistema
 */
export function TeamSetupEditorialGrid({ t }: { t: TeamSetupGridCopy }) {
  return (
    <div className="min-w-0 space-y-6 md:space-y-8">
      <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.36em] text-black/72">{t.gridEyebrow}</p>

      <div className="grid min-w-0 grid-cols-1 gap-px overflow-hidden rounded-none border border-black/12 bg-black/10 lg:grid-cols-12 lg:gap-px lg:items-stretch">
        {/* 1 · Frontend */}
        <SetupCard
          className="order-1 lg:col-span-12 lg:col-start-1 lg:row-start-1"
          variant="photo"
          src={TEAM_SETUP_IMAGES.frontendWide}
          alt="Frontend · setup Las Girls"
          aspect="video"
          eyebrow={t.gridFrontend.eyebrow}
          hook={t.gridFrontend.hook}
          rest={t.gridFrontend.rest}
          priority
          splitWide
          imageSizes={SIZES_GRID_FE_ROW}
        />
        {/* 2 · Backend + Operaciones & organización */}
        <SetupCard
          className="order-2 h-full lg:col-span-6 lg:col-start-1 lg:row-start-2"
          variant="photo"
          src={TEAM_SETUP_IMAGES.backend}
          alt="Backend & infra · setup Las Girls"
          aspect="square"
          eyebrow={t.gridBackend.eyebrow}
          hook={t.gridBackend.hook}
          rest={t.gridBackend.rest}
          imageSizes={SIZES_GRID_HALF}
        />
        <SetupCard
          className="order-3 h-full lg:col-span-6 lg:col-start-7 lg:row-start-2"
          variant="photo"
          src={TEAM_SETUP_IMAGES.projectManager}
          alt="Operaciones · setup Las Girls"
          aspect="square"
          eyebrow={t.gridPm.eyebrow}
          hook={t.gridPm.hook}
          rest={t.gridPm.rest}
          imageSizes={SIZES_GRID_HALF}
        />
        {/* 3 · Video + Finanzas */}
        <SetupCard
          className="order-4 h-full lg:col-span-6 lg:col-start-1 lg:row-start-3"
          variant="photo"
          src={TEAM_SETUP_IMAGES.video}
          alt="Video & contenido"
          aspect="square"
          eyebrow={t.gridVideo.eyebrow}
          hook={t.gridVideo.hook}
          rest={t.gridVideo.rest}
          imageSizes={SIZES_GRID_HALF}
        />
        <SetupCard
          className="order-5 h-full lg:col-span-6 lg:col-start-7 lg:row-start-3"
          variant="photo"
          src={TEAM_SETUP_IMAGES.finances}
          alt="Finanzas · setup"
          aspect="square"
          eyebrow={t.gridFinances.eyebrow}
          hook={t.gridFinances.hook}
          rest={t.gridFinances.rest}
          imageSizes={SIZES_GRID_HALF}
        />
        {/* 4 · Redes (pastel) + quote sistema */}
        <SetupCard
          className="order-6 h-full lg:col-span-6 lg:col-start-1 lg:row-start-4"
          variant="solid"
          solidTone="rose"
          eyebrow={t.gridSocial.eyebrow}
          hook={t.gridSocial.hook}
          rest={t.gridSocial.rest}
        />
        <SetupCard
          className="order-7 lg:col-span-6 lg:col-start-7 lg:row-start-4"
          variant="quote"
          quoteLayout="half"
          rest={t.quoteBlockLines}
        />
      </div>
    </div>
  );
}
