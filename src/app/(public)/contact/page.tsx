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
    <section className="section-shell">
      <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[0.8fr_1.2fr]">
        <div>
          <h1 className="font-display text-5xl uppercase md:text-7xl">{contactPageContent.title}</h1>
          <p className="mt-4 text-zinc-700">{contactPageContent.subtitle}</p>
          <ul className="mt-6 space-y-2">
            {contactPageContent.channels.map((channel) => (
              <li key={channel.label}>
                <a href={channel.href} className="text-sm underline">
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
