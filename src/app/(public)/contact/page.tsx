import type { Metadata } from "next";
import { ContactForm } from "@/components/forms/contact-form";
import { contactPageContent } from "@/content/site/contact";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Contacto | Las Girls+",
  description:
    "Contanos tu proyecto. La primera consulta es para orientarte con criterio y sin costo.",
  path: "/contact",
});

export default function ContactPage() {
  return (
    <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#f4ede6] px-4 py-20 md:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <div className="border-2 border-black bg-[#ffe3f0] p-6">
          <h1 className="font-display text-[12vw] uppercase leading-[0.84] text-black md:text-[6rem]">{contactPageContent.title}</h1>
          <p className="mt-4 text-black/75">{contactPageContent.subtitle}</p>
          <ul className="mt-6 space-y-2">
            {contactPageContent.channels.map((channel) => (
              <li key={channel.label}>
                <a href={channel.href} className="text-sm uppercase tracking-[0.08em] text-[#ff2f9d] underline">
                  {channel.label}: {channel.value}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
