import { adminDb } from "@/lib/firebase/admin";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function AdminClientDetailPage({ params }: Props) {
  const { id } = await params;
  const snapshot = await adminDb.collection("clients").doc(id).get();

  if (!snapshot.exists) {
    return <p>Cliente no encontrado.</p>;
  }

  const client = snapshot.data() as Record<string, string>;

  return (
    <section className="grid gap-4">
      <h1 className="font-display text-5xl uppercase">{client.displayName}</h1>
      <p className="text-sm">Estado: {client.status}</p>
      <p className="text-sm">Email: {client.email}</p>
      <p className="text-sm">Modelo: {client.billingModel}</p>
      <p className="text-sm">Pago: {client.paymentStatus}</p>
    </section>
  );
}
