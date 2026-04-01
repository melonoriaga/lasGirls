import Link from "next/link";
import { adminDb } from "@/lib/firebase/admin";

export default async function AdminLeadsPage() {
  const snapshot = await adminDb.collection("leads").orderBy("createdAt", "desc").limit(50).get();
  const leads = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<
    Record<string, string>
  >;

  return (
    <section>
      <h1 className="font-display text-5xl uppercase">Leads</h1>
      <div className="mt-6 overflow-x-auto border border-black bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead className="border-b border-black bg-zinc-100">
            <tr>
              <th className="p-3">Nombre</th>
              <th className="p-3">Tipo</th>
              <th className="p-3">Estado</th>
              <th className="p-3">Fecha</th>
              <th className="p-3">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {leads.map((lead) => (
              <tr key={lead.id} className="border-b border-black/20">
                <td className="p-3">{lead.fullName}</td>
                <td className="p-3">{lead.inquiryType}</td>
                <td className="p-3">{lead.status}</td>
                <td className="p-3">{String(lead.createdAt ?? "").slice(0, 10)}</td>
                <td className="p-3">
                  <Link href={`/admin/leads/${lead.id}`} className="underline">
                    Ver
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
