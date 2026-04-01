import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";

export default async function AdminClientsPage() {
  const snapshot = await adminDb
    .collection("clients")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();
  const clients = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<
    Record<string, string>
  >;

  return (
    <section>
      <h1 className="font-display text-5xl uppercase">Clientes</h1>
      <div className="mt-6 grid gap-4">
        {clients.map((client) => (
          <article key={client.id} className="border border-black bg-white p-4">
            <h2 className="text-lg font-semibold">{client.displayName}</h2>
            <p className="text-sm text-zinc-600">{client.email}</p>
            <Link href={`/admin/clients/${client.id}`} className="mt-2 inline-block text-sm underline">
              Ver detalle
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
