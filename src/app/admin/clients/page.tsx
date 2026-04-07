import { ClientsTablePanel } from "@/components/admin/clients-table-panel";
import { getSessionActor } from "@/lib/api/admin-session";

export default async function AdminClientsPage() {
  const actor = await getSessionActor();
  const actorUid = actor?.uid ?? "";
  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Clientes</h1>

      <ClientsTablePanel actorUid={actorUid} />
    </section>
  );
}
