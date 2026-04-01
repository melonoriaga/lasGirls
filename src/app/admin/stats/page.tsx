import { adminDb } from "@/lib/firebase/admin";

const count = async (collectionName: string) => {
  const snapshot = await adminDb.collection(collectionName).count().get();
  return snapshot.data().count;
};

export default async function AdminStatsPage() {
  const [leads, clients, posts, likes] = await Promise.all([
    count("leads"),
    count("clients"),
    count("blogPosts"),
    count("blogLikes"),
  ]);

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Stats interno</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Leads", leads],
          ["Clientes", clients],
          ["Posts", posts],
          ["Likes", likes],
        ].map(([label, value]) => (
          <article key={String(label)} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">{label}</p>
            <p className="mt-2 text-4xl font-semibold tracking-tight text-zinc-900">{String(value)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
