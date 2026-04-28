"use client";

import Link from "next/link";
import { useDictionary } from "@/i18n/locale-provider";

export default function ServicesPage() {
  const d = useDictionary();
  const p = d.servicesPage;
  const cards = d.cards;

  return (
    <section className="section-shell">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">{p.h1}</h1>
        <p className="mt-4 text-zinc-700">{p.intro}</p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map((service) => (
            <article key={service.title} className="border border-black bg-white p-6">
              <h2 className="font-display text-3xl uppercase">{service.title}</h2>
              <p className="mt-3 text-sm text-zinc-700">{service.description}</p>
              <Link href="/contact" className="mt-4 inline-block text-sm underline">
                {p.cta}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
