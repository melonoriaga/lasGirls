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
    <section className="vh-section brutal-section relative overflow-hidden border-y-2 border-black bg-[#f4ede6] px-4 py-20 md:px-10">
      <div className="mx-auto max-w-6xl">
        <p className="inline-flex bg-black px-3 py-1 text-[10px] uppercase tracking-[0.16em] text-[#f4ede6]">about</p>
        <h1 className="mt-6 font-display text-[15vw] uppercase leading-[0.84] text-black md:text-[8rem]">
          {aboutPageContent.title}
        </h1>
        <p className="mt-6 max-w-4xl text-base leading-relaxed text-black/80 md:text-xl">{aboutPageContent.description}</p>
        <div className="mt-8 h-[3px] w-24 bg-[#ff5faf]" />
        <ul className="mt-10 grid gap-3 md:grid-cols-2">
          {aboutPageContent.principles.map((item) => (
            <li key={item} className="border-2 border-black bg-[#ffe3f0] p-5 text-sm uppercase tracking-[0.06em] text-black/90">
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
