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
      <h1 className="font-display text-5xl uppercase">Stats interno</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-4">
        {[
          ["Leads", leads],
          ["Clientes", clients],
          ["Posts", posts],
          ["Likes", likes],
        ].map(([label, value]) => (
          <article key={String(label)} className="border border-black bg-white p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{label}</p>
            <p className="mt-2 font-display text-4xl uppercase">{String(value)}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
