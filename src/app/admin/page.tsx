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
      <h1 className="font-display text-5xl uppercase">Dashboard</h1>
      <p className="mt-3 text-sm text-zinc-700">
        Resumen ejecutivo del estado comercial y de contenidos.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article key={card.label} className="border border-black bg-white p-5">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{card.label}</p>
            <p className="mt-2 font-display text-5xl uppercase">{card.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
