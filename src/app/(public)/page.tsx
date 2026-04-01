import Link from "next/link";
import Image from "next/image";
import { ContactForm } from "@/components/forms/contact-form";
import { Button } from "@/components/ui/button";
import { homeContent, serviceCards } from "@/content/site/home";

export default function HomePage() {
  return (
    <div>
      <section className="relative overflow-hidden border-b border-black px-4 py-20 md:px-8 md:py-28">
        <Image
          src="/brand/stickers/sticker-1.png"
          alt=""
          aria-hidden
          width={220}
          height={220}
          className="pointer-events-none absolute -right-6 bottom-5 z-10 hidden w-36 rotate-[-10deg] opacity-85 md:block"
        />
        <div className="pointer-events-none absolute -right-20 top-5 font-display text-[9rem] uppercase leading-none text-black/5 md:text-[14rem]">
          Las Girls+
        </div>
        <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[1.2fr_0.8fr]">
          <div>
            <p className="mb-4 text-xs uppercase tracking-[0.2em]">{homeContent.hero.kicker}</p>
            <h1 className="font-display text-5xl uppercase leading-[0.95] md:text-8xl">
              {homeContent.hero.title}
            </h1>
            <p className="mt-6 max-w-2xl text-base text-zinc-700 md:text-lg">
              {homeContent.hero.subtitle}
            </p>
            <p className="mt-4 max-w-xl text-sm text-zinc-600">{homeContent.hero.supporting}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href={homeContent.hero.ctaPrimary.href}>
                <Button>{homeContent.hero.ctaPrimary.label}</Button>
              </Link>
              <Link href={homeContent.hero.ctaSecondary.href}>
                <Button variant="outline">{homeContent.hero.ctaSecondary.label}</Button>
              </Link>
            </div>
          </div>
          <div className="relative border border-black bg-[#ffd2ec] p-6">
            <Image
              src="/brand/logos/logo-black-1.png"
              alt="Las Girls+ marca"
              width={160}
              height={48}
              className="mb-4 h-8 w-auto object-contain opacity-90"
            />
            <p className="font-accent text-3xl">Tu proyecto no tiene que estar perfecto para arrancar.</p>
            <p className="mt-4 text-sm text-zinc-700">
              Si hoy solo tenés una idea, una intuición o una necesidad sin estructura, es una gran
              base para trabajar.
            </p>
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">{homeContent.anxietyBlock.title}</h2>
          <div className="mt-6 grid gap-5 text-zinc-700 md:grid-cols-3">
            {homeContent.anxietyBlock.paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="section-shell bg-[var(--surface)]">
        <div className="mx-auto max-w-5xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">Quiénes somos</h2>
          <p className="mt-6 max-w-4xl text-zinc-700">{homeContent.about.text}</p>
        </div>
      </section>

      <section id="metodologia" className="section-shell">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">{homeContent.methodology.title}</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {homeContent.methodology.blocks.map((block) => (
              <article key={block.title} className="border border-black bg-white p-5">
                <h3 className="text-sm font-semibold uppercase tracking-wider">{block.title}</h3>
                <p className="mt-3 text-sm text-zinc-700">{block.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="servicios" className="section-shell bg-black text-white">
        <div className="mx-auto max-w-7xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">Servicios</h2>
          <p className="mt-4 max-w-4xl text-white/80">{homeContent.servicesDisclaimer}</p>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {serviceCards.map((service) => (
              <article key={service.title} className="border border-white p-6">
                <p className="text-xs uppercase tracking-[0.14em] text-white/65">{service.microcopy}</p>
                <h3 className="mt-2 font-display text-3xl uppercase">{service.title}</h3>
                <p className="mt-3 text-sm text-white/85">{service.description}</p>
                <p className="mt-4 text-sm text-white/70">
                  <span className="font-semibold text-white">Resuelve:</span> {service.solves}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  <span className="font-semibold text-white">Aplica en:</span> {service.examples}
                </p>
                <Link href="/contact" className="mt-4 inline-block text-sm underline">
                  Quiero consultar este servicio
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">Combinaciones reales</h2>
          <div className="mt-8 grid gap-3 md:grid-cols-3">
            {homeContent.featuredCombos.map((combo) => (
              <div key={combo} className="border border-black bg-white p-4 text-sm uppercase tracking-wider">
                {combo}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell relative overflow-hidden bg-[#ffd2ec]">
        <Image
          src="/brand/stickers/sticker-3.png"
          alt=""
          aria-hidden
          width={190}
          height={190}
          className="pointer-events-none absolute -left-8 top-8 hidden w-28 rotate-[-18deg] opacity-70 md:block"
        />
        <Image
          src="/brand/stickers/sticker-6.png"
          alt=""
          aria-hidden
          width={210}
          height={210}
          className="pointer-events-none absolute bottom-4 right-3 hidden w-32 rotate-[9deg] opacity-70 md:block"
        />
        <div className="mx-auto max-w-6xl">
          <h2 className="font-display text-4xl uppercase md:text-6xl">Por qué Las Girls+</h2>
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {homeContent.why.map((item) => (
              <li key={item} className="border border-black bg-[#fef8fb] p-4 text-sm">
                {item}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="contacto" className="section-shell">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="font-display text-4xl uppercase md:text-6xl">Contacto</h2>
            <p className="mt-4 text-zinc-700">
              Contanos en qué etapa estás. Si todavía no sabés exactamente qué necesitás, también
              está perfecto. La primera conversación es para orientarte.
            </p>
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.14em]">
              Primera consulta sin costo
            </p>
          </div>
          <ContactForm />
        </div>
      </section>
    </div>
  );
}
