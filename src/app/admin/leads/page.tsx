import { adminDb } from "@/lib/firebase/admin";
import { LeadsTablePanel } from "@/components/admin/leads-table-panel";

export default async function AdminLeadsPage() {
  const snapshot = await adminDb.collection("leads").orderBy("createdAt", "desc").limit(50).get();
  const leads = snapshot.docs.map((item) => ({ id: item.id, ...item.data() })) as Array<{
    id: string;
    fullName?: string;
    inquiryType?: string;
    status?: string;
    createdAt?: string;
  }>;

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Leads</h1>
      <LeadsTablePanel leads={leads} />
    </section>
  );
}
