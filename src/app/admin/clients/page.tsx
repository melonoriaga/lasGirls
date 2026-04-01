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
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Clientes</h1>
      <div className="mt-6 grid gap-4">
        {clients.length === 0 ? (
          <article className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-600">
            No hay clientes todavía. Convertí un lead para empezar a gestionar clientes.
          </article>
        ) : (
          clients.map((client) => (
            <article key={client.id} className="rounded-2xl border border-zinc-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-zinc-900">{client.displayName}</h2>
              <p className="text-sm text-zinc-600">{client.email}</p>
              <Link
                href={`/admin/clients/${client.id}`}
                className="mt-2 inline-block text-sm font-medium text-[#db2777] hover:underline"
              >
                Ver detalle
              </Link>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
