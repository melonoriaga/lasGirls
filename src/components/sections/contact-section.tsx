import Image from "next/image";
import { ContactForm } from "@/components/forms/contact-form";
import { contactPageContent } from "@/content/site/contact";

type ContactSectionProps = {
  id?: string;
};

export function ContactSection({ id }: ContactSectionProps) {
  return (
    <section id={id} className="relative min-h-screen w-full overflow-hidden border-y-2 border-black bg-[#f4ede6]">
      <div className="relative z-10 flex min-h-screen w-full flex-col justify-center px-0 py-20">
        <div className="mx-auto w-full max-w-[1280px] px-4 md:px-8">
          <header className="mb-8 md:mb-10">
            <h1 className="font-display text-[12vw] uppercase leading-[0.84] text-black md:text-[6rem]">
              CONTACT
            </h1>
            <p className="mt-3 max-w-[64ch] text-sm text-black/75 md:text-base">{contactPageContent.subtitle}</p>
            <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-black/65">
              Primera consulta sin costo
            </p>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
              {contactPageContent.channels.map((channel) => (
                <a
                  key={channel.label}
                  href={channel.href}
                  className="text-xs uppercase tracking-[0.12em] text-[#ff2f9d] underline decoration-black/35 underline-offset-4"
                >
                  {channel.label}: {channel.value}
                </a>
              ))}
            </div>
          </header>

          <ContactForm />
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_72%,rgba(255,111,175,0.16),transparent_45%)]" />
        <div className="absolute -bottom-8 right-0 h-[48vh] w-[46vw] min-w-[300px] max-w-[560px] opacity-90 md:bottom-0 md:right-4">
          <Image
            src="/brand/stickers/STICKER10.png"
            alt="Decoración contacto"
            fill
            className="object-contain object-bottom-right"
          />
        </div>
      </div>
    </section>
  );
}
