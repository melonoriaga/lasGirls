import Link from "next/link";
import { serviceCards } from "@/content/site/home";

export default function ServicesPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">Servicios</h1>
        <p className="mt-4 text-zinc-700">
          No vendemos paquetes rígidos. Combinamos frentes de trabajo según la etapa real de tu
          proyecto.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {serviceCards.map((service) => (
            <article key={service.title} className="border border-black bg-white p-6">
              <h2 className="font-display text-3xl uppercase">{service.title}</h2>
              <p className="mt-3 text-sm text-zinc-700">{service.description}</p>
              <Link href="/contact" className="mt-4 inline-block text-sm underline">
                Consultar servicio
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
