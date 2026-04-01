import type { Metadata } from "next";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Stats | Las Girls+",
  description: "Panel público con métricas del sitio, leads y contenido en evolución.",
  path: "/stats",
});

const cards = [
  { label: "Leads totales", value: "—", helper: "Conexión Firestore lista" },
  { label: "Consultas este mes", value: "—", helper: "Vacío elegante sin dataset real" },
  { label: "Posts publicados", value: "—", helper: "Se completará con CMS" },
  { label: "Engagement blog", value: "—", helper: "Likes por post" },
];

export default function StatsPage() {
  return (
    <section className="section-shell">
      <div className="mx-auto max-w-6xl">
        <h1 className="font-display text-5xl uppercase md:text-7xl">Stats</h1>
        <p className="mt-4 max-w-3xl text-zinc-700">
          Esta página está preparada para consumir agregaciones reales desde Firestore. Si todavía
          no hay datos suficientes, priorizamos lectura clara y estados vacíos útiles.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {cards.map((card) => (
            <article key={card.label} className="border border-black bg-white p-6">
              <p className="text-xs uppercase tracking-wider text-zinc-500">{card.label}</p>
              <p className="mt-2 font-display text-5xl uppercase">{card.value}</p>
              <p className="mt-3 text-sm text-zinc-600">{card.helper}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
