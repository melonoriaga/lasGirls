import Image from "next/image";
import Link from "next/link";
import { ContactForm } from "@/components/forms/contact-form";
import { LiquidEtherBg } from "@/components/sections/liquid-ether-bg";
import { StickerWindows } from "@/components/sections/sticker-windows";
import { homeContent, serviceCards } from "@/content/site/home";

const heroStickers = [
  { id: "h1", src: "/brand/stickers/STICKER1.png", x: 15, y: 24, w: 130, rotate: -8, delay: 0.2 },
  { id: "h2", src: "/brand/stickers/STICKER6.png", x: 88, y: 26, w: 150, rotate: 10, delay: 0.35 },
  { id: "h3", src: "/brand/stickers/STICKER8.png", x: 82, y: 78, w: 160, rotate: -6, delay: 0.45 },
];

const serviceStickers = [
  { id: "s1", src: "/brand/stickers/STICKER4.png", x: 10, y: 18, w: 110, rotate: -12, delay: 0.1 },
  { id: "s2", src: "/brand/stickers/STICKER5.png", x: 91, y: 18, w: 130, rotate: 9, delay: 0.2 },
  { id: "s3", src: "/brand/stickers/STICKER9.png", x: 82, y: 80, w: 140, rotate: -8, delay: 0.32 },
];

const teamStickers = [
  { id: "t1", src: "/brand/stickers/STICKER2.png", x: 8, y: 78, w: 140, rotate: 8, delay: 0.12 },
  { id: "t2", src: "/brand/stickers/STICKER3.png", x: 89, y: 75, w: 130, rotate: -7, delay: 0.22 },
];

export default function HomePage() {
  return (
    <>
      <section id="hero" className="vh-section relative isolate min-h-screen overflow-hidden border-y-2 border-black bg-[#f4ede6]">
        <LiquidEtherBg className="absolute inset-0 z-0" />
        <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-multiply" />
        <StickerWindows items={heroStickers} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1080px] flex-col items-center justify-center px-4 pb-14 pt-24 text-center md:pt-28">
          <p className="inline-flex rotate-[-1.4deg] items-center gap-2 rounded-full bg-black px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f4ede6]">
            <span>◆</span>
            las girls+ · agencia creativa
            <span>◆</span>
          </p>

          <h1 className="mt-8 w-full font-display text-[16vw] uppercase leading-[0.84] text-black md:text-[10.5rem]">
            desarrollo
          </h1>
          <h1 className="w-full font-display text-[16vw] uppercase leading-[0.84] text-black md:text-[10.5rem]">
            digital que
          </h1>
          <div className="mt-1 w-full bg-black py-1">
            <p className="font-display text-[16vw] uppercase leading-[0.84] text-[#ff5faf] md:text-[10.5rem]">
              convierte
            </p>
          </div>
          <p className="mt-3 font-accent text-5xl text-black md:text-7xl">no que decora</p>

          <div className="mt-8 h-[2px] w-full max-w-[520px] bg-black" />
          <p className="mt-5 max-w-[560px] text-sm leading-relaxed text-black/80 md:text-base">
            {homeContent.hero.subtitle}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="hero-cta hero-cta--dark">
              Contanos tu proyecto
            </Link>
            <Link href="#servicios" className="hero-cta hero-cta--light">
              Ver servicios
            </Link>
          </div>

          <div className="mt-7 inline-flex flex-wrap items-center justify-center gap-2 text-xs">
            <span className="rounded-full bg-[#ff5faf] px-3 py-1 font-display tracking-wider text-white">
              PRIMERA CONSULTA SIN COSTO
            </span>
            <span className="text-black/70">No necesitás llegar con todo definido.</span>
          </div>
        </div>
      </section>

      <section className="vh-section section-shell relative border-t-2 border-black bg-[#f7d0e1]" id="metodologia">
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center">
          <h2 className="font-display text-5xl uppercase leading-[0.9] md:text-8xl">
            trabajar con nosotras
          </h2>
          <p className="font-accent text-4xl text-black md:text-5xl">es así de simple.</p>

          <div className="mt-8 grid border border-black md:grid-cols-3">
            {homeContent.methodology.blocks.slice(0, 3).map((block, index) => (
              <article key={block.title} className="relative min-h-64 border-r border-black p-6 last:border-r-0">
                <span className="absolute left-3 top-2 font-display text-8xl text-white/30">{index + 1}</span>
                <h3 className="relative z-10 font-display text-5xl uppercase leading-[0.86]">{block.title}</h3>
                <p className="relative z-10 mt-6 max-w-xs text-sm uppercase tracking-wider text-black/80">
                  {block.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="vh-section section-shell relative border-t-2 border-black bg-[#f4ede6]">
        <StickerWindows items={serviceStickers} />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center">
          <div className="text-center">
            <h2 className="font-display text-6xl uppercase leading-[0.8] md:text-9xl">qué</h2>
            <p className="font-accent text-6xl text-[#ff4fa9] md:text-8xl">necesitás</p>
            <h2 className="font-display text-6xl uppercase leading-[0.8] md:text-9xl">hoy?</h2>
          </div>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-black/75">
            Elegí el frente que querés activar y lo ordenamos juntas. Sin paquetes rígidos.
          </p>

          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {serviceCards.slice(0, 6).map((service) => (
              <article key={service.title} className="group border border-black bg-[#f9ddec] p-5 transition hover:-translate-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-black/60">{service.microcopy}</p>
                <h3 className="mt-2 font-display text-6xl uppercase leading-[0.85] text-black group-hover:text-[#ff4fa9] md:text-7xl">
                  {service.title.split(" ")[0]}
                </h3>
                <p className="mt-3 text-sm text-black/80">{service.description}</p>
                <Link href="/contact" className="mt-4 inline-block text-xs uppercase tracking-[0.16em] underline">
                  consultar
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="equipo" className="vh-section section-shell relative border-t-2 border-black bg-[#0d0d0d] text-[#fff8f0]">
        <StickerWindows items={teamStickers} />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center">
          <p className="inline-flex bg-[#ff5faf] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">
            equipo estratégico
          </p>
          <h2 className="mt-4 font-display text-6xl uppercase leading-[0.86] md:text-8xl">no hacemos todo solas.</h2>
          <p className="mt-4 max-w-3xl text-sm text-white/70">{homeContent.about.text}</p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="border border-white/40 bg-[#161616] p-4">
              <Image src="/brand/stickers/STICKER7.png" alt="Jean" width={360} height={420} className="h-60 w-full object-contain" />
              <h3 className="mt-3 font-display text-5xl uppercase">Jean</h3>
              <p className="text-sm text-white/75">Dirección estratégica · roadmap · decisiones de producto.</p>
            </article>
            <article className="border border-white/40 bg-[#161616] p-4">
              <Image src="/brand/stickers/STICKER9.png" alt="Mel" width={360} height={420} className="h-60 w-full object-contain" />
              <h3 className="mt-3 font-display text-5xl uppercase">Mel</h3>
              <p className="text-sm text-white/75">Dirección creativa · branding · diseño y narrativa visual.</p>
            </article>
            <article className="border border-white/40 bg-[#161616] p-4">
              <Image src="/brand/stickers/STICKER3.png" alt="Equipo extendido" width={360} height={420} className="h-60 w-full object-contain" />
              <h3 className="mt-3 font-display text-4xl uppercase">equipo extendido</h3>
              <p className="text-sm text-white/75">Desarrollo, UX/UI, contenido, social, audiovisual y marketing.</p>
            </article>
          </div>
        </div>
      </section>

      <section id="contacto" className="vh-section section-shell border-y-2 border-black !px-0 !pb-0 !pt-0">
        <ContactForm />
      </section>
    </>
  );
}
