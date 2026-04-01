"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import Link from "next/link";
import CircularText from "@/components/CircularText";
import CurvedLoop from "@/components/CurvedLoop";
import DecryptedText from "@/components/DecryptedText";
import RotatingText from "@/components/RotatingText";
import LiquidEther from "@/components/LiquidEther";
import TextType from "@/components/TextType";
import { ContactForm } from "@/components/forms/contact-form";
import { StickerWindows } from "@/components/sections/sticker-windows";
import { homeContent, serviceCards } from "@/content/site/home";

gsap.registerPlugin(ScrollTrigger);

const heroStickers = [
  { id: "h1", src: "/brand/stickers/sticker-1.png", x: 84, y: 74, w: 380, rotate: -9, delay: 0.18 },
];

const teamStickers = [
  { id: "t1", src: "/brand/stickers/STICKER7.png", x: 15, y: 68, w: 400, rotate: 7, delay: 0.18 },
];

const contactStickers = [
  { id: "c1", src: "/brand/stickers/STICKER10.png", x: 84, y: 66, w: 420, rotate: -5, delay: 0.2 },
];

const heroRotatingWords = [
  "FUNCIONAN",
  "CONVIERTEN",
  "VENDEN",
  "ESCALAN",
  "TIENEN SENTIDO",
  "SE PUEDEN USAR",
  "NO SON HUMO",
  "ESTAN BIEN PENSADAS",
];

const SERVICE_ROW_COLORS = ["#ff6faf", "#ff9fcf", "#f8d4de", "#ffd6e8", "#fff0f8"];

const impactStickerPoses = [
  { x: 0, y: 0, r: 0 },
  { x: -18, y: -10, r: -6 },
  { x: 14, y: -16, r: 8 },
  { x: -10, y: 12, r: -9 },
  { x: 22, y: 8, r: 7 },
];

export default function HomePage() {
  const heroScopeRef = useRef<HTMLElement | null>(null);
  const [impactPoseIndex, setImpactPoseIndex] = useState(0);

  useEffect(() => {
    if (!heroScopeRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".hero-main-line",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.75, ease: "power3.out", stagger: 0.11 }
      );

      gsap.fromTo(
        ".hero-rotating-reveal",
        { autoAlpha: 0, y: 16, scaleY: 0.92 },
        { autoAlpha: 1, y: 0, scaleY: 1, duration: 0.62, ease: "power3.out", delay: 0.28 }
      );

      gsap.fromTo(
        ".hero-soft-line",
        { autoAlpha: 0, y: 18 },
        { autoAlpha: 1, y: 0, duration: 0.62, ease: "power2.out", delay: 0.42, stagger: 0.08 }
      );

      gsap.utils.toArray<HTMLElement>(".brutal-section").forEach((section, index) => {
        gsap.fromTo(
          section.querySelectorAll(".brutal-reveal"),
          { autoAlpha: 0, y: 60, scale: 0.97 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.9,
            stagger: 0.09,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 78%",
            },
          }
        );

        gsap.fromTo(
          section,
          { backgroundPositionY: "0%" },
          {
            backgroundPositionY: `${(index + 1) * 10}%`,
            ease: "none",
            scrollTrigger: {
              trigger: section,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });

      gsap.fromTo(
        ".service-card",
        { autoAlpha: 0, y: 45, rotateX: -7, transformOrigin: "top center" },
        {
          autoAlpha: 1,
          y: 0,
          rotateX: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#servicios",
            start: "top 70%",
          },
        }
      );

      const impactSection = document.querySelector("#impact-poster");
      if (impactSection) {
        gsap.fromTo(
          "#impact-poster .impact-line",
          { autoAlpha: 0, y: 42 },
          {
            autoAlpha: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: impactSection,
              start: "top 72%",
            },
          }
        );

        gsap.fromTo(
          "#impact-poster .impact-fade",
          { autoAlpha: 0, y: 24, scale: 0.96 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            stagger: 0.08,
            duration: 0.72,
            ease: "power2.out",
            scrollTrigger: {
              trigger: impactSection,
              start: "top 68%",
            },
          }
        );

        gsap.to("#impact-poster .impact-char-wrap", {
          yPercent: -10,
          ease: "none",
          scrollTrigger: {
            trigger: impactSection,
            start: "top bottom",
            end: "bottom top",
            scrub: 0.9,
          },
        });
      }

      const methodologySection = document.querySelector("#metodologia");
      if (methodologySection) {
        gsap.fromTo(
          "#metodologia .meth-header",
          { autoAlpha: 0, y: 32 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.72,
            ease: "power3.out",
            scrollTrigger: {
              trigger: methodologySection,
              start: "top 76%",
            },
          }
        );

        gsap.utils.toArray<HTMLElement>("#metodologia .meth-col").forEach((col, index) => {
          gsap.fromTo(
            col,
            { autoAlpha: 0, y: 70 },
            {
              autoAlpha: 1,
              y: 0,
              duration: 0.82,
              ease: "power3.out",
              delay: index * 0.06,
              scrollTrigger: {
                trigger: col,
                start: "top 84%",
              },
            }
          );

          gsap.to(col.querySelector(".meth-index"), {
            yPercent: -14,
            ease: "none",
            scrollTrigger: {
              trigger: col,
              start: "top bottom",
              end: "bottom top",
              scrub: 0.7,
            },
          });
        });
      }
    }, heroScopeRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <section
        id="hero"
        ref={heroScopeRef}
        className="vh-section relative isolate min-h-screen overflow-hidden border-y-2 border-black bg-[#f4ede6]"
      >
        <div className="absolute inset-0 z-0">
          <LiquidEther
            colors={["#fff8ef", "#ff5faf", "#ffb9d2"]}
            mouseForce={20}
            cursorSize={100}
            isViscous
            viscous={30}
            iterationsViscous={32}
            iterationsPoisson={32}
            resolution={0.5}
            isBounce={false}
            autoDemo
            autoSpeed={0.5}
            autoIntensity={2.2}
            takeoverDuration={0.25}
            autoResumeDelay={3000}
            autoRampDuration={0.6}
          />
        </div>
        <div className="absolute inset-0 z-[1] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-15 mix-blend-multiply" />
        <StickerWindows items={heroStickers} />

        <div className="relative z-10 mx-auto flex min-h-screen max-w-[1080px] flex-col items-center justify-center px-4 pb-14 pt-24 text-center md:pt-28">
          <p className="hero-soft-line inline-flex rotate-[-1.4deg] items-center gap-2 rounded-full bg-black px-4 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f4ede6]">
            <span>◆</span>
            LAS GIRLS+ · BRANDING · TECH · ESTRATEGIA
            <span>◆</span>
          </p>

          <h1 className="hero-main-line mt-8 w-full font-display text-[16vw] uppercase leading-[0.84] text-black md:text-[10.5rem]">
            SOLUCIONES
          </h1>
          <h1 className="hero-main-line w-full font-display text-[16vw] uppercase leading-[0.84] text-black md:text-[10.5rem]">
            DIGITALES QUE
          </h1>
          <div className="hero-rotating-reveal mt-1 flex w-full items-center justify-center bg-black py-1">
            <div className="hero-rotating-shell flex min-h-[0.9em] items-center justify-center overflow-hidden">
              <RotatingText
                texts={heroRotatingWords}
                rotationInterval={1850}
                auto
                loop
                splitBy="words"
                transition={{ type: "spring", damping: 24, stiffness: 310 }}
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "-120%", opacity: 0 }}
                mainClassName="hero-rotating-main"
                splitLevelClassName="hero-rotating-word"
                elementLevelClassName="hero-rotating-char"
              />
            </div>
          </div>
          <p className="hero-soft-line mt-3 font-accent text-5xl text-black md:text-7xl">no que decoran</p>

          <div className="hero-soft-line mt-8 h-[2px] w-full max-w-[520px] bg-black" />
          <p className="hero-soft-line mt-5 max-w-[620px] text-sm leading-relaxed text-black/80 md:text-base">
            No necesitás tener todo claro. Si tenés una idea -aunque esté en cero- te ayudamos a bajarla, ordenarla y
            convertirla en algo que funcione de verdad.
          </p>

          <div className="hero-soft-line mt-7 flex flex-wrap items-center justify-center gap-3">
            <Link href="/contact" className="hero-cta hero-cta--dark">
              EMPEZAR AHORA
            </Link>
            <Link href="#servicios" className="hero-cta hero-cta--light">
              VER SERVICIOS
            </Link>
          </div>

          <div className="hero-soft-line mt-7 inline-flex flex-wrap items-center justify-center gap-2 text-xs text-black/72">
            <span>Primera consulta sin costo</span>
            <span>·</span>
            <span>Te ayudamos a entender qué necesitás antes de venderte algo</span>
          </div>
        </div>
        <div className="absolute right-5 top-20 z-[12] hidden md:block">
          <CircularText
            text="LAS GIRLS+ ✦ BRANDING ✦ WEB ✦ APPS ✦ "
            spinDuration={18}
            onHover="speedUp"
            className="lg-circular-text"
          />
        </div>
      </section>

      <section id="impact-poster" className="brutal-section relative isolate h-screen min-h-0 overflow-hidden border-t-2 border-black bg-[#f4ede6] px-4 md:px-10">
        <div className="impact-side-text left-2 hidden md:block">LAS GIRLS+ · BRUTAL BRANDING · WEB · APPS</div>
        <div className="impact-side-text right right-2 hidden md:block">ESTRATEGIA · CONTENIDO · CRECIMIENTO REAL</div>

        <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[2] hidden -translate-y-1/2 md:block">
          <CurvedLoop
            marqueeText="✦ en menos de un dia · en menos de un dia · en menos de un dia · "
            speed={1.35}
            curveAmount={420}
            direction="right"
            interactive={false}
            className="impact-curved-loop"
          />
        </div>

        <div className="relative z-[4] mx-auto h-full w-full max-w-[1280px]">
          <div className="impact-badge impact-fade">✦ ENTREGA EN TIEMPO REAL</div>
          <div className="impact-stamp impact-fade hidden md:flex">
            <span className="impact-stamp__num">24</span>
            <span className="impact-stamp__sub">HS</span>
          </div>

          <div className="absolute inset-x-0 top-[8%] z-[6] text-center">
            <h2 className="impact-line impact-line--top font-display text-[19vw] uppercase leading-[0.8] tracking-[-0.02em] text-black md:text-[12rem]">
              TU IDEA
            </h2>
            <h2 className="impact-line impact-line--bottom -mt-2 font-display text-[19vw] uppercase leading-[0.8] tracking-[-0.02em] text-[#ff5faf] md:text-[12rem]">
              LISTA HOY.
            </h2>
          </div>

          <div
            className="impact-char-wrap impact-fade absolute left-1/2 top-1/2 z-[8] h-[66vw] w-[66vw] max-h-[640px] max-w-[640px]"
            onMouseEnter={() => setImpactPoseIndex((idx) => (idx + 1) % impactStickerPoses.length)}
            style={{
              transform: `translate(-50%, -50%) translate(${impactStickerPoses[impactPoseIndex].x}px, ${impactStickerPoses[impactPoseIndex].y}px) rotate(${impactStickerPoses[impactPoseIndex].r}deg)`,
            }}
          >
            <Image src="/brand/stickers/STICKER2.png" alt="Sticker Las Girls+" fill className="object-contain object-bottom" priority={false} />
          </div>

          <div className="impact-card impact-card--left impact-fade hidden md:block">
            <p className="impact-card__kicker">✦ SIN VUELTAS</p>
            <h4 className="impact-card__title">NO NECESITAS</h4>
            <p className="impact-card__script">seis meses de reuniones.</p>
            <p className="impact-card__copy">Si ya tenes marca, textos e imagenes, lo bajamos a tierra rapido y con criterio.</p>
          </div>

          <div className="impact-card impact-card--right impact-fade hidden md:block">
            <p className="impact-card__kicker">✦ INCLUYE TODO</p>
            <p className="impact-card__copy">Con formulario, dominio conectado y estructura lista para recibir consultas reales.</p>
            <p className="impact-card__pill">✦ BRANDING + WEB + LIVE</p>
          </div>

          <div className="impact-fade absolute inset-x-0 bottom-[8%] z-[10] px-3 md:hidden">
            <div className="mx-auto max-w-md space-y-3">
              <div className="border-2 border-black bg-[#ffd7ea]/92 px-3 py-2">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-black">✦ SIN VUELTAS</p>
                <p className="mt-1 font-display text-2xl uppercase leading-none text-black">NO NECESITAS</p>
                <p className="font-accent text-lg text-[#ff2f9d]">seis meses de reuniones.</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.08em] text-black/90">
                  Si ya tenes marca, textos e imagenes, lo bajamos a tierra rapido y con criterio.
                </p>
              </div>
              <div className="border-2 border-black bg-[#ffeaf4]/92 px-3 py-2">
                <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-black">✦ INCLUYE TODO</p>
                <p className="mt-1 text-[0.62rem] uppercase tracking-[0.08em] text-black/90">
                  Con formulario, dominio conectado y estructura lista para recibir consultas reales.
                </p>
                <p className="mt-2 inline-block bg-black px-2 py-1 text-[0.55rem] font-bold uppercase tracking-[0.14em] text-[#ff5faf]">
                  ✦ BRANDING + WEB + LIVE
                </p>
              </div>
            </div>
          </div>

          <div className="impact-script-wrap impact-fade absolute inset-x-0 bottom-[6%] z-[9] mx-auto max-w-4xl text-center">
            <p className="impact-script font-accent text-4xl text-[#ff5faf] md:text-6xl">sin vueltas, con estrategia.</p>
            <p className="mt-3 text-sm uppercase tracking-[0.14em] text-black/80 md:text-base">
              branding + web + contenido + direccion creativa para que tu marca se vea, se entienda y convierta.
            </p>
          </div>
        </div>
      </section>

      <section
        id="metodologia"
        className="vh-section relative overflow-hidden border-t-2 border-black bg-[#ff6faf] px-5 py-20 md:px-10"
      >
        <div className="mx-auto w-full max-w-[1200px]">
          <div className="meth-header relative z-[4] mb-14">
            <h2 className="font-display text-6xl uppercase leading-[0.95] text-black md:text-[5.5rem]">
              TRABAJAR CON NOSOTRAS
            </h2>
            <p className="font-accent text-5xl text-black md:text-[3.2rem]">es asi de simple.</p>
          </div>

          <div className="process-grid-rows relative z-[4] grid border-t-2 border-black md:grid-cols-3">
            {homeContent.methodology.blocks.slice(0, 3).map((block, index) => (
              <article
                key={block.title}
                className="meth-col process-col relative overflow-hidden border-l-0 border-black px-6 py-10 md:border-l-2 md:first:border-l-0"
              >
                <span className="meth-index pointer-events-none absolute left-2 top-0 font-display text-[clamp(9rem,30vw,24rem)] leading-[0.7] text-[#ffb8d9] opacity-60">
                  {index + 1}
                </span>

                <div className="relative z-10 flex min-h-[280px] flex-col justify-between">
                  <h3 className="font-display text-[clamp(2.1rem,5.5vw,5.8rem)] uppercase leading-[1.02] tracking-[-0.02em] text-black">
                    <DecryptedText
                      text={block.title.toUpperCase()}
                      speed={32}
                      maxIterations={12}
                      sequential
                      animateOn="view"
                      className="inline-block"
                      encryptedClassName="inline-block text-black/70"
                    />
                  </h3>
                  <p className="max-w-[30ch] font-body text-[clamp(1.02rem,2.2vw,1.35rem)] uppercase leading-[1.6] tracking-[-0.01em] text-black/90">
                    {block.description}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="vh-section relative overflow-hidden border-t-2 border-black bg-[#f4ede6]">
        <div className="w-full max-w-none">
          <div className="brutal-reveal relative z-[4] flex min-h-screen flex-col justify-center px-5 py-14 md:px-12">
            <h2 className="relative z-[2] max-w-[14ch] font-display text-[13vw] uppercase leading-[0.84] text-black md:text-[8.5rem]">
              LO QUE PODEMOS{" "}
              <TextType
                as="span"
                text={["CONSTRUIR"]}
                className="text-[#ff2f9d]"
                typingSpeed={66}
                deletingSpeed={44}
                pauseDuration={2000}
                initialDelay={250}
                loop={false}
                showCursor={false}
                startOnVisible
              />
            </h2>
            <p className="relative z-[2] mt-6 max-w-4xl text-sm leading-relaxed text-black/85 md:text-xl">
              <TextType
                as="span"
                text={[
                  "Estos son algunos de los trabajos que realizamos junto a nuestra red de aliados estrategicos. Segun el proyecto, formamos el equipo necesario para disenar, desarrollar y lanzar productos reales.",
                ]}
                typingSpeed={14}
                deletingSpeed={14}
                pauseDuration={1800}
                initialDelay={520}
                loop={false}
                showCursor={false}
                startOnVisible
              />
            </p>
            <div className="relative z-[2] mt-8 h-[3px] w-20 bg-[#ff2f9d]" />
          </div>

          <div className="relative z-[4] w-full border-t-[3px] border-black">
            {serviceCards.slice(0, 10).map((service, index) => (
              <article
                key={service.title}
                className="service-row group border-b border-black"
                style={{ background: SERVICE_ROW_COLORS[index % SERVICE_ROW_COLORS.length] }}
              >
                <div className="flex items-start justify-between gap-4 px-0 pb-3 pt-7">
                  <h3 className="font-display text-[10vw] uppercase leading-[0.86] tracking-[-0.03em] text-black md:text-[6.6rem]">
                    <span className="mr-[0.18em]">{String(index + 1).padStart(2, "0")}.</span>
                    {service.title}
                  </h3>
                  <span className="mt-2 inline-block h-3 w-3 shrink-0 rounded-full bg-black" />
                </div>
                <div className="grid transition-[grid-template-rows] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]">
                  <div className="min-h-0 overflow-hidden border-t border-black">
                    <div className="flex items-start justify-between gap-5 px-0 py-5">
                      <p className="text-sm uppercase leading-[1.65] tracking-[0.08em] text-black/90 md:text-lg">
                        {service.description}
                      </p>
                      <span className="mt-1 inline-block h-3 w-3 shrink-0 rounded-full bg-black" />
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="equipo" className="brutal-section vh-section section-shell relative border-t-2 border-black bg-[#111] text-[#fff8f0]">
        <StickerWindows items={teamStickers} />
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center">
          <p className="brutal-reveal inline-flex bg-[#ff5faf] px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-black">
            equipo estratégico
          </p>
          <h2 className="brutal-reveal mt-4 font-display text-6xl uppercase leading-[0.86] text-[#f4ede6] md:text-8xl">
            <DecryptedText
              text="no hacemos todo solas."
              speed={26}
              maxIterations={12}
              sequential
              animateOn="view"
              className="inline-block"
              encryptedClassName="inline-block text-white/55"
            />
          </h2>
          <p className="brutal-reveal mt-4 max-w-xl text-sm text-white/70">
            Trabajamos con red real de especialistas. Vos hablás con nosotras: nos encargamos del resto.
          </p>

          <div className="allies-grid brutal-reveal mt-8">
            <Link href="/team/jean" className="ally-card group block" aria-label="Ver perfil de Jean">
              <div className="ally-ring-wrap" aria-hidden>
                <CircularText
                  text="JEAN ✦ BRANDING ✦ ESTRATEGIA ✦ "
                  spinDuration={16}
                  onHover="speedUp"
                  className="ally-ring"
                />
              </div>
              <div className="ally-image-wrap">
                <Image src="/brand/girls/jean.png" alt="Jean" fill className="ally-image object-contain object-bottom" />
              </div>
              <div className="ally-tag">✦ ESTRATEGIA & ROADMAP</div>
              <div className="ally-overlay">
                <h3 className="ally-name">
                  <DecryptedText
                    text="JEAN"
                    speed={24}
                    maxIterations={12}
                    sequential
                    animateOn="view"
                    className="inline-block"
                    encryptedClassName="inline-block text-[#f4ede6]/55"
                  />
                </h3>
                <p className="ally-script">estructura que ordena.</p>
                <div className="ally-skills">
                  <span>Discovery</span>
                  <span>Roadmaps</span>
                  <span>Producto</span>
                </div>
              </div>
            </Link>

            <Link href="/team/mel" className="ally-card group block" aria-label="Ver perfil de Mel">
              <div className="ally-ring-wrap" aria-hidden>
                <CircularText
                  text="MEL ✦ DIRECCION CREATIVA ✦ BRANDING ✦ "
                  spinDuration={14}
                  onHover="speedUp"
                  className="ally-ring ally-ring--reverse"
                />
              </div>
              <div className="ally-image-wrap">
                <Image src="/brand/girls/mel.png" alt="Mel" fill className="ally-image object-contain object-bottom" />
              </div>
              <div className="ally-tag">✦ BRANDING & DIRECCIÓN CREATIVA</div>
              <div className="ally-overlay">
                <h3 className="ally-name">
                  <DecryptedText
                    text="MEL"
                    speed={24}
                    maxIterations={12}
                    sequential
                    animateOn="view"
                    className="inline-block"
                    encryptedClassName="inline-block text-[#f4ede6]/55"
                  />
                </h3>
                <p className="ally-script">identidad que se recuerda.</p>
                <div className="ally-skills">
                  <span>Branding</span>
                  <span>Visual Systems</span>
                  <span>Narrativa</span>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section
        id="contacto"
        className="vh-section section-shell relative isolate overflow-hidden border-y-2 border-black !px-0 !pb-0 !pt-0"
      >
        <StickerWindows items={contactStickers} containerClassName="z-[1]" />
        <div className="relative z-[5]">
          <ContactForm />
        </div>
      </section>
    </>
  );
}
