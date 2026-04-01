import { adminDb } from "@/lib/firebase/admin";

const countCollection = async (name: string) => {
  const snapshot = await adminDb.collection(name).count().get();
  return snapshot.data().count;
};

export default async function AdminDashboardPage() {
  const [leads, clients, posts] = await Promise.all([
    countCollection("leads"),
    countCollection("clients"),
    countCollection("blogPosts"),
  ]);

  const cards = [
    { label: "Total leads", value: leads },
    { label: "Clientes activos", value: clients },
    { label: "Posts cargados", value: posts },
  ];

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Resumen ejecutivo del estado comercial y de contenidos.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{card.label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">{card.value}</p>
            <div className="mt-4 h-1.5 w-full rounded-full bg-rose-200" />
          </article>
        ))}
      </div>
    </section>
  );
}
