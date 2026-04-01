import type { Metadata } from "next";
import { aboutPageContent } from "@/content/site/about";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About | Las Girls+",
  description:
    "Conocé cómo trabajamos en Las Girls+: estrategia, diseño y desarrollo con una metodología flexible.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-5xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">{aboutPageContent.title}</h1>
        <p className="mt-6 text-zinc-700">{aboutPageContent.description}</p>
        <ul className="mt-8 grid gap-3 md:grid-cols-2">
          {aboutPageContent.principles.map((item) => (
            <li key={item} className="border border-black bg-white p-4 text-sm">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
