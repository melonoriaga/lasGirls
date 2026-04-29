"use client";

import dynamic from "next/dynamic";
import { ContactForm } from "@/components/forms/contact-form";
import { useDictionary } from "@/i18n/locale-provider";

function ContactStickerSkeleton() {
  return (
    <div
      className="relative mx-auto flex w-full max-w-[300px] items-center justify-center lg:mx-0 lg:max-w-none lg:justify-end"
      aria-hidden
    >
      <div className="h-[min(70vw,240px)] w-[min(70vw,240px)] rounded-2xl bg-black/[0.06] lg:h-[min(320px,24vw)] lg:w-[min(320px,24vw)]" />
    </div>
  );
}

const ContactStickerFloat = dynamic(
  () =>
    import("@/components/sections/contact-sticker-float").then(
      (m) => m.ContactStickerFloat,
    ),
  { ssr: false, loading: ContactStickerSkeleton },
);

type ContactSectionProps = {
  id?: string;
};

export function ContactSection({ id }: ContactSectionProps) {
  const d = useDictionary();
  const c = d.contactSection;
  const cp = d.contactPage;

  return (
    <section
      id={id}
      className="relative w-full overflow-hidden border-t-2 border-black bg-[#ff6faf] px-4 py-16 text-black sm:px-6 md:py-20 lg:px-10 lg:py-24"
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-col gap-14 md:gap-16">
        <header className="flex max-w-3xl flex-col gap-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-black/65 md:text-[11px]">
            {c.kicker}
          </p>
          <h2 className="font-display text-[clamp(2.5rem,9vw,4.75rem)] font-black uppercase leading-[0.9] tracking-[-0.03em] text-black">
            {c.h2a}
            <span className="text-black">{c.h2period}</span>
          </h2>
          <p className="font-accent text-[clamp(1.65rem,4.5vw,2.75rem)] leading-[0.98] text-black">
            {c.accent}
          </p>
          <p className="max-w-[60ch] text-base leading-[1.6] text-black/75 md:text-lg">
            {cp.subtitle}
          </p>

          <div className="mt-2 flex flex-wrap gap-2">
            {[
              { label: "Jean", value: "jean@lasgirlsplus.com", href: "mailto:jean@lasgirlsplus.com" },
              { label: "Mel", value: "mel@lasgirlsplus.com", href: "mailto:mel@lasgirlsplus.com" },
              {
                label: "WhatsApp",
                value: cp.waValue,
                href: "https://wa.me/5493586003572",
              },
              {
                label: "Instagram",
                value: "@lasgirls.plus",
                href: "https://www.instagram.com/lasgirls.plus?igsh=MWdyZXEybXYyOW9tOQ%3D%3D&utm_source=qr",
              },
            ].map((channel, i) => {
              const accent = i % 2 === 0;
              return (
              <a
                key={`${channel.label}-${channel.value}`}
                href={channel.href}
                target={channel.href.startsWith("http") ? "_blank" : undefined}
                rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={`group inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 font-mono text-[10px] font-medium uppercase tracking-[0.085em] transition-colors ${
                  accent
                    ? "border-black/40 bg-black/10 text-black/80 hover:border-black/55 hover:bg-black/[0.14]"
                    : "border-black/25 bg-black/[0.06] text-black/58 hover:border-black/40 hover:bg-black/10"
                }`}
              >
                <span
                  aria-hidden
                  className={`text-[7px] leading-none ${accent ? "text-black/45" : "text-black/35"}`}
                >
                  ◆
                </span>
                <span className="opacity-70">{channel.label}</span>
                <span className="text-black/35">/</span>
                <span>{channel.value}</span>
              </a>
              );
            })}
          </div>
        </header>

        <div className="grid w-full grid-cols-1 items-start gap-12 lg:grid-cols-3 lg:items-center lg:gap-14 xl:gap-16">
          <div className="min-w-0 lg:col-span-2">
            <ContactForm />
          </div>
          <div className="flex w-full items-center justify-center lg:justify-end">
            <ContactStickerFloat />
          </div>
        </div>

        <div className="flex items-center gap-3 border-t-2 border-black/80 pt-5 text-[10px] uppercase tracking-[0.2em] text-black/60">
          <span className="font-mono">{c.footerLine}</span>
          <span className="ml-auto font-mono">{c.reply}</span>
        </div>
      </div>
    </section>
  );
}
