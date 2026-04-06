import { ClientsTablePanel } from "@/components/admin/clients-table-panel";

export default function AdminClientsPage() {
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Clientes</h1>

      <ClientsTablePanel />
    </section>
  );
}
