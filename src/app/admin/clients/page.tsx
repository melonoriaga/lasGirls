import { ClientsTablePanel } from "@/components/admin/clients-table-panel";

export default function AdminClientsPage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Clientes</h1>
      <p className="mt-2 max-w-2xl text-sm text-zinc-600">
        Tabla paginada con Firestore real (cursor). Los datos legados (displayName, billingModel, etc.) se muestran gracias a
        campos de compatibilidad al leer cada fila.
      </p>
      <ClientsTablePanel />
    </section>
  );
}
