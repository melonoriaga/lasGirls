"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useDictionary, useLocale } from "@/i18n/locale-provider";

const EDITORIAL_IMAGES = [
  "/DECO/deco001.png",
  "/DECO/deco002.png",
  "/DECO/deco003.png",
  "/DECO/deco004.png",
  "/DECO/deco005.png",
  "/DECO/deco006.png",
] as const;

const NOISE_TEXTURE = encodeURIComponent(
  "<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180' viewBox='0 0 180 180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)' opacity='0.35'/></svg>",
);

function TextNoiseOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-1"
      style={{
        backgroundImage: `url("data:image/svg+xml,${NOISE_TEXTURE}")`,
        backgroundRepeat: "repeat",
        backgroundSize: "180px 180px",
        mixBlendMode: "multiply",
        opacity: 0.22,
      }}
    >
    </div>
  );
}

/** Service grid + editorial wall (home). Copy from i18n dictionaries. */
export function ServicesShowcaseSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const { locale } = useLocale();
  const d = useDictionary();
  const G = d.servicesGrid;
  const services = d.cards.slice(0, 6);
  const featuredCombos = d.featuredCombos.slice(0, 6);
  const whyItems = d.why.slice(0, 4);

  useEffect(() => {
    if (!sectionRef.current) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".svc-module").forEach((module, index) => {
        gsap.set(module, { autoAlpha: 1, y: 0 });
        gsap.from(module, {
          y: 34,
          duration: 0.72,
          ease: "power3.out",
          delay: index * 0.02,
          scrollTrigger: {
            trigger: module,
            start: "top 84%",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".svc-line-draw").forEach((line) => {
        gsap.fromTo(
          line,
          { scaleX: 0, transformOrigin: "left center" },
          {
            scaleX: 1,
            duration: 0.8,
            ease: "power2.out",
            scrollTrigger: {
              trigger: line,
              start: "top 90%",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".svc-image-panel").forEach((panel) => {
        gsap.from(panel, {
          scale: 1.04,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: panel,
            start: "top 85%",
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".svc-title").forEach((title, index) => {
        gsap.fromTo(
          title,
          { autoAlpha: 0, y: 24, rotateX: -8, transformOrigin: "bottom center" },
          {
            autoAlpha: 1,
            y: 0,
            rotateX: 0,
            duration: 0.7,
            ease: "power3.out",
            delay: index * 0.01,
            scrollTrigger: {
              trigger: title,
              start: "top 86%",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".svc-copy").forEach((copy, index) => {
        gsap.fromTo(
          copy,
          { autoAlpha: 0, y: 16 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.62,
            ease: "power2.out",
            delay: index * 0.005,
            scrollTrigger: {
              trigger: copy,
              start: "top 90%",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".svc-kicker").forEach((kicker) => {
        gsap.fromTo(
          kicker,
          { autoAlpha: 0, x: -16 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.55,
            ease: "power2.out",
            scrollTrigger: {
              trigger: kicker,
              start: "top 92%",
            },
          },
        );
      });

      gsap.utils.toArray<HTMLElement>(".svc-parallax-num").forEach((num) => {
        gsap.to(num, {
          yPercent: -14,
          ease: "none",
          scrollTrigger: {
            trigger: num,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.7,
          },
        });
      });

      gsap.utils.toArray<HTMLElement>(".svc-image-panel").forEach((panel, index) => {
        gsap.to(panel, {
          yPercent: index % 2 === 0 ? -8 : -5,
          ease: "none",
          scrollTrigger: {
            trigger: panel,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
          },
        });
      });
    }, sectionRef);

    return () => ctx.revert();
  }, [locale]);

  if (services.length < 6) return null;

  return (
    <section
      ref={sectionRef}
      id="servicios"
      className="vh-section relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-t-2 border-black bg-[#ff6faf]"
    >
      <div className="grid w-full grid-cols-1 border-b-2 border-black bg-[#f4ede6] lg:grid-cols-12">
        <div className="svc-module relative overflow-hidden border-b border-black px-4 py-3 lg:col-span-12 lg:px-8">
          <TextNoiseOverlay />
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[0.6rem] uppercase tracking-[0.22em] text-black/75 md:text-[0.66rem]">
            <span>{G.eyebrowArchive[0]}</span>
            <span className="svc-line-draw h-px w-8 bg-black/60" />
            <span>{G.eyebrowArchive[1]}</span>
            <span className="svc-line-draw h-px w-8 bg-black/60" />
            <span>{G.eyebrowArchive[2]}</span>
          </div>
        </div>

        <header className="svc-module relative overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:col-span-8 lg:border-r lg:p-10">
          <TextNoiseOverlay />
          <h2 className="svc-title font-display text-[clamp(2.2rem,11vw,8.8rem)] uppercase leading-[0.9] tracking-[-0.018em] text-black">
            {G.mainTitleLines[0]}
            <br />
            {G.mainTitleLines[1]}
            <br />
            {G.mainTitleLines[2]}
          </h2>
          <div className="svc-line-draw mt-5 h-[2px] w-24 bg-black" />
        </header>

        <div className="svc-module relative overflow-hidden border-b border-black bg-[#efe7dd] p-5 md:p-7 lg:col-span-4 lg:p-8">
          <TextNoiseOverlay />
          <p className="svc-copy max-w-[31ch] text-[0.9rem] uppercase leading-[1.45] tracking-[0.065em] text-black md:text-[1.04rem]">
            {G.intro}
          </p>
          <p className="svc-copy mt-4 text-[0.76rem] uppercase leading-[1.45] tracking-[0.065em] text-black/88 md:text-[0.84rem]">{G.editorialGeneral}</p>
          <p className="svc-copy mt-4 border-t border-black pt-3 text-[0.78rem] uppercase leading-[1.45] tracking-[0.07em] text-black/85 md:text-[0.86rem]">
            {d.servicesDisclaimer}
          </p>
        </div>

        {/* Rows 01–02: order stays in inner grids only so 01→06 keep editorial order on the outer grid */}
        <div className="col-span-12 grid grid-cols-1 border-b border-black lg:grid-cols-12">
          <article className="svc-module relative order-2 overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:order-2 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-10">
            <TextNoiseOverlay />
            <span className="svc-parallax-num pointer-events-none absolute right-3 top-2 font-display text-[clamp(5rem,14vw,10rem)] leading-none text-black/10">
              01
            </span>
            <p className="svc-kicker font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.kickerPrincipal}</p>
            <h3 className="svc-title mt-4 w-full font-display text-[clamp(2.4rem,8.5vw,6.6rem)] uppercase leading-[0.9] tracking-[-0.015em] text-black">
              {services[0].title}
            </h3>
            <p className="svc-copy mt-3 w-full text-[0.96rem] uppercase leading-[1.42] tracking-[0.07em] text-black/88 md:text-[1.1rem]">
              {services[0].microcopy}
            </p>
            <p className="svc-copy mt-4 w-full text-[1.04rem] uppercase leading-[1.45] tracking-[0.058em] text-black md:text-[1.22rem]">
              {services[0].description}
            </p>
            <div className="svc-line-draw mt-6 h-px w-full bg-black" />
          </article>

          <article className="svc-module order-1 border-b border-black bg-[#eae3d8] p-4 lg:order-1 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-5">
            <div className="svc-image-panel relative aspect-square max-h-[430px] overflow-hidden border border-black">
              <Image src={EDITORIAL_IMAGES[0]} alt={services[0].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 42vw" />
            </div>
            <div className="mt-3 border-t border-black pt-2">
              <p className="svc-kicker font-mono text-[0.56rem] uppercase tracking-[0.2em] text-black/70">{G.kickerFeatured}</p>
              <p className="svc-copy mt-1 text-[0.74rem] uppercase leading-[1.45] tracking-[0.07em] text-black">{featuredCombos[0]}</p>
            </div>
          </article>
        </div>

        <div className="col-span-12 grid grid-cols-1 border-b border-black lg:grid-cols-12">
          <article className="svc-module order-2 border-b border-black bg-[#efe7dd] p-4 lg:order-2 lg:col-span-4 lg:border-b-0 lg:border-r lg:p-5">
            <div className="svc-image-panel relative aspect-square overflow-hidden border border-black">
              <Image src={EDITORIAL_IMAGES[1]} alt={services[1].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 33vw" />
            </div>
            <p className="svc-copy mt-3 border-t border-black pt-2 text-[0.76rem] uppercase leading-[1.45] tracking-[0.065em] text-black/90">{services[1].microcopy}</p>
          </article>

          <article className="svc-module relative order-1 overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:order-1 lg:col-span-8 lg:border-b-0 lg:border-r lg:p-9">
            <TextNoiseOverlay />
            <span className="svc-parallax-num pointer-events-none absolute right-3 top-1 font-display text-[clamp(4.6rem,13vw,9rem)] leading-none text-black/10">
              02
            </span>
            <p className="svc-kicker font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.kickerNetwork}</p>
            <h3 className="svc-title mt-4 max-w-[14ch] font-display text-[clamp(1.85rem,6.4vw,4.9rem)] uppercase leading-[0.92] tracking-[-0.014em] text-black">
              {services[1].title}
            </h3>
            <p className="svc-copy mt-2 max-w-[34ch] text-[0.84rem] uppercase leading-[1.43] tracking-[0.07em] text-black/85 md:text-[0.94rem]">
              {services[1].microcopy}
            </p>
            <p className="svc-copy mt-3 max-w-[40ch] text-[0.9rem] uppercase leading-[1.46] tracking-[0.058em] text-black md:text-[1.03rem]">
              {services[1].description}
            </p>
            <p className="svc-copy mt-3 text-[0.76rem] uppercase leading-[1.44] tracking-[0.062em] text-black/88">{G.editorialReality}</p>
            <p className="svc-copy mt-3 border-t border-black pt-2 text-[0.76rem] uppercase leading-[1.45] tracking-[0.06em] text-black/88">{services[1].solves}</p>
            <div className="mt-5 flex items-center justify-between border-t border-black pt-2">
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.footerEdit[0]}</span>
              <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.footerEdit[1]}</span>
            </div>
          </article>
        </div>

        <article className="svc-module relative overflow-hidden border-b border-black bg-[#eae3d8] p-5 md:p-7 lg:col-span-3 lg:border-r lg:p-7">
          <TextNoiseOverlay />
          <span className="svc-parallax-num pointer-events-none absolute left-2 top-[-6%] font-display text-[clamp(5rem,14vw,10rem)] leading-none text-black/10">
            03
          </span>
          <h3 className="svc-title relative z-10 mt-8 font-display text-[clamp(2.25rem,6.5vw,4.9rem)] uppercase leading-[0.9] tracking-[-0.014em] text-black">
            {services[2].title}
          </h3>
          <p className="svc-copy relative z-10 mt-3 text-[0.95rem] uppercase leading-[1.4] tracking-[0.064em] text-black/92 md:text-[1.08rem]">{services[2].microcopy}</p>
          <p className="svc-copy relative z-10 mt-3 border-t border-black pt-2 text-[0.86rem] uppercase leading-[1.42] tracking-[0.058em] text-black/88 md:text-[0.98rem]">{G.editorialAccompany}</p>
        </article>

        <article className="svc-module relative overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:col-span-6 lg:border-r lg:p-8">
          <TextNoiseOverlay />
          <p className="svc-kicker font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.kickerService03}</p>
          <p className="svc-copy mt-3 w-full text-[1.16rem] uppercase leading-[1.42] tracking-[0.054em] text-black md:text-[1.35rem]">
            {services[2].description}
          </p>
          <div className="mt-3 grid gap-2 border-t border-black pt-2">
            <p className="text-[0.92rem] uppercase leading-[1.4] tracking-[0.056em] text-black/92 md:text-[1.02rem]">
              <span className="font-mono mr-2 text-[0.56rem] tracking-[0.2em] text-black/70">{G.labelResuelve}</span>
              {services[2].solves}
            </p>
            <p className="text-[0.92rem] uppercase leading-[1.4] tracking-[0.056em] text-black/92 md:text-[1.02rem]">
              <span className="font-mono mr-2 text-[0.56rem] tracking-[0.2em] text-black/70">{G.labelEjemplos}</span>
              {services[2].examples}
            </p>
          </div>
          <div className="svc-line-draw mt-5 h-px w-full bg-black" />
        </article>

        <article className="svc-module border-b border-black bg-[#efe7dd] p-4 lg:col-span-3 lg:p-4">
          <div className="svc-image-panel relative aspect-square overflow-hidden border border-black">
            <Image src={EDITORIAL_IMAGES[2]} alt={services[2].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 33vw" />
          </div>
          {/* <div className="mt-3 border-t border-black pt-2">
            <p className="font-mono text-[0.56rem] uppercase tracking-[0.2em] text-black/70">errores comunes</p>
            <div className="mt-1 grid gap-1">
              {ERRORES_COMUNES.slice(0, 3).map((item) => (
                <p key={item} className="text-[0.68rem] uppercase leading-[1.4] tracking-[0.065em] text-black/88">
                  {item}
                </p>
              ))}
            </div>
          </div> */}
        </article>

        <article className="svc-module relative overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:col-span-6 lg:border-r lg:p-9">
          <TextNoiseOverlay />
          <span className="svc-parallax-num pointer-events-none absolute right-3 top-2 font-display text-[clamp(4.6rem,13vw,9rem)] leading-none text-black/10">
            04
          </span>
          <p className="svc-kicker font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.kickerArchivo04}</p>
          <h3 className="svc-title mt-4 max-w-[14ch] font-display text-[clamp(1.9rem,6.1vw,4.6rem)] uppercase leading-[0.92] tracking-[-0.014em] text-black">
            {services[3].title}
          </h3>
          <p className="mt-2 max-w-[33ch] text-[0.82rem] uppercase leading-[1.43] tracking-[0.07em] text-black/85 md:text-[0.92rem]">{services[3].microcopy}</p>
          <p className="mt-3 max-w-[38ch] text-[0.9rem] uppercase leading-[1.48] tracking-[0.058em] text-black md:text-[1.02rem]">
            {services[3].description}
          </p>
          <p className="mt-3 border-t border-black pt-2 text-[0.76rem] uppercase leading-[1.45] tracking-[0.06em] text-black/88">{services[3].solves}</p>
        </article>

        <article className="svc-module border-b border-black bg-[#eae3d8] p-4 lg:col-span-3 lg:border-r lg:p-5">
          <div className="svc-image-panel relative aspect-square overflow-hidden border border-black">
            <Image src={EDITORIAL_IMAGES[3]} alt={services[3].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 25vw" />
          </div>
          <p className="mt-3 border-t border-black pt-2 text-[0.74rem] uppercase leading-[1.45] tracking-[0.07em] text-black">{featuredCombos[3]}</p>
        </article>

        <article className="svc-module relative overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:col-span-3 lg:p-8">
          <TextNoiseOverlay />
          <span className="svc-parallax-num pointer-events-none absolute right-2 top-[-4%] font-display text-[clamp(4.8rem,13vw,9rem)] leading-none text-black/10">
            05
          </span>
          <p className="svc-kicker relative z-10 font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">
            {G.kickerService05}
          </p>
          <h3 className="svc-title relative z-10 mt-10 font-display text-[clamp(1.45rem,4.8vw,3.3rem)] uppercase leading-[0.92] tracking-[-0.012em] text-black">
            {services[4].title}
          </h3>
          <p className="mt-2 text-[0.76rem] uppercase leading-[1.44] tracking-[0.07em] text-black/85">{services[4].microcopy}</p>
          <p className="mt-3 text-[0.86rem] uppercase leading-normal tracking-[0.058em] text-black md:text-[0.96rem]">
            {services[4].description}
          </p>
          <p className="mt-3 border-t border-black pt-2 text-[0.74rem] uppercase leading-[1.42] tracking-[0.06em] text-black/88">{services[4].solves}</p>
        </article>

        <div className="svc-module border-b border-black bg-[#f4ede6] lg:col-span-12">
          <div className="grid grid-cols-1 lg:grid-cols-12">
            <article className="border-b border-black bg-[#efe7dd] p-4 lg:col-span-3 lg:border-b-0 lg:border-r lg:p-5">
              <div className="svc-image-panel relative mx-auto aspect-square max-h-[340px] overflow-hidden border border-black lg:max-h-[320px]">
                <Image src={EDITORIAL_IMAGES[4]} alt={services[5].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 25vw" />
              </div>
              <div className="mt-3 grid gap-1 border-t border-black pt-2">
                {whyItems.map((item) => (
                  <p key={item} className="text-[0.68rem] uppercase leading-[1.4] tracking-[0.07em] text-black/88">
                    {item}
                  </p>
                ))}
              </div>
            </article>

            <article className="relative overflow-hidden border-b border-black bg-[#f3eee8] p-5 md:p-7 lg:col-span-6 lg:border-b-0 lg:border-r lg:p-10">
              <TextNoiseOverlay />
              <span className="svc-parallax-num pointer-events-none absolute right-6 top-4 font-display text-[clamp(4.2rem,12vw,8rem)] leading-none text-black/10 lg:right-10">
                06
              </span>
              <p className="svc-kicker font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.kickerCierre}</p>
              <h3 className="svc-title mt-4 max-w-[15ch] font-display text-[clamp(2rem,6.6vw,5rem)] uppercase leading-[0.9] tracking-[-0.014em] text-black">
                {services[5].title}
              </h3>
              <p className="mt-2 max-w-[36ch] text-[0.83rem] uppercase leading-[1.43] tracking-[0.07em] text-black/85 md:text-[0.94rem]">{services[5].microcopy}</p>
              <p className="mt-3 max-w-[42ch] text-[0.94rem] uppercase leading-[1.45] tracking-[0.06em] text-black md:text-[1.08rem]">
                {services[5].description}
              </p>
              <p className="mt-3 border-t border-black pt-2 text-[0.78rem] uppercase leading-[1.43] tracking-[0.06em] text-black/88">{services[5].examples}</p>
              <div className="mt-6 flex items-center justify-between border-t border-black pt-2">
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.footerEditorial[0]}</span>
                <span className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-black/70">{G.footerEditorial[1]}</span>
              </div>
            </article>

            <article className="border-b border-black bg-[#eae3d8] p-4 lg:col-span-3 lg:border-b-0 lg:p-5">
              <div className="svc-image-panel relative mx-auto aspect-square max-h-[340px] overflow-hidden border border-black lg:max-h-[320px]">
                <Image src={EDITORIAL_IMAGES[5]} alt={services[5].title} fill className="object-cover object-center" sizes="(max-width: 1024px) 100vw, 25vw" />
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-black pt-2">
                {featuredCombos.slice(4, 6).map((combo) => (
                  <span key={combo} className="border border-black px-2 py-1 text-[0.62rem] uppercase tracking-[0.08em] text-black">
                    {combo}
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  );
}
