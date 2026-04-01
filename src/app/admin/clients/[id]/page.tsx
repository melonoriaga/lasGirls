import { adminDb } from "@/lib/firebase/admin";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = await adminDb.collection("clients").doc(id).get();

  if (!snapshot.exists) {
    return <p className="text-sm text-zinc-600">Cliente no encontrado.</p>;
  }

  const client = snapshot.data() as Record<string, string>;

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">{client.displayName}</h1>
      <div className="mt-6 grid gap-2 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm">Estado: <strong>{client.status}</strong></p>
        <p className="text-sm">Email: <span className="text-zinc-600">{client.email}</span></p>
        <p className="text-sm">Modelo: <span className="text-zinc-600">{client.billingModel}</span></p>
        <p className="text-sm">Pago: <span className="text-zinc-600">{client.paymentStatus}</span></p>
      </div>
    </section>
  );
}
