"use client";

import { ContactForm } from "@/components/forms/contact-form";
import { contactPageContent } from "@/content/site/contact";

type ContactSectionProps = {
  id?: string;
};

export function ContactSection({ id }: ContactSectionProps) {
  return (
    <section
      id={id}
      className="relative w-full overflow-hidden border-t-2 border-black bg-[#ff6faf] px-4 py-16 text-black sm:px-6 md:py-20 lg:px-10 lg:py-24"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-14 md:gap-16">
        {/* ─────────── HEADER ─────────── */}
        <header className="flex flex-col gap-4 max-w-3xl">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-black/65 md:text-[11px]">
            05 — Hablemos
          </p>
          <h2 className="font-display text-[clamp(2.5rem,9vw,4.75rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-black">
            Hablemos de tu idea<span className="text-black">.</span>
          </h2>
          <p className="font-accent text-[clamp(1.65rem,4.5vw,2.75rem)] leading-[0.98] text-black">
            primera consulta sin costo.
          </p>
          <p className="max-w-[60ch] text-base leading-[1.6] text-black/75 md:text-lg">
            {contactPageContent.subtitle}
          </p>

          <div className="mt-2 flex flex-wrap gap-2.5">
            {contactPageContent.channels.map((channel) => (
              <a
                key={channel.label}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="group inline-flex items-center gap-2 border-2 border-black/80 bg-[#F3EEE8] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-black shadow-[0_6px_0_0_rgba(0,0,0,0.9)] transition-transform hover:-translate-y-[2px] hover:shadow-[0_8px_0_0_rgba(0,0,0,0.9)]"
              >
                <span className="text-[8px] text-black/70">◆</span>
                <span className="opacity-70">{channel.label}</span>
                <span className="text-black">/</span>
                <span>{channel.value}</span>
              </a>
            ))}
          </div>
        </header>

        {/* ─────────── FORM ─────────── */}
        <ContactForm />

        {/* ─────────── FOOTER MARK ─────────── */}
        <div className="flex items-center gap-3 border-t-2 border-black/80 pt-5 text-[10px] uppercase tracking-[0.2em] text-black/60">
          <span className="font-mono">/ Las Girls+ · Hablemos / 2026</span>
          <span className="ml-auto font-mono">↘ Te respondemos en 24/48hs</span>
        </div>
      </div>
    </section>
  );
}
