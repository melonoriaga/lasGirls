import { adminDb } from "@/lib/firebase/admin";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { LeadsTablePanel } from "@/components/admin/leads-table-panel";

export default async function AdminLeadsPage() {
  const actor = await getSessionActor();
  const actorUid = actor?.uid ?? "";
  const snapshot = await adminDb.collection("leads").orderBy("createdAt", "desc").limit(50).get();
  const leads = snapshot.docs
    .map((item) => ({ id: item.id, ...item.data() }))
    .filter((row) => (actorUid ? canAccessRecord(row, actorUid) : false)) as Array<{
    id: string;
    fullName?: string;
    email?: string;
    company?: string;
    inquiryType?: string;
    serviceInterest?: string[];
    status?: string;
    budgetStatus?: string;
    latestBudgetSentAt?: string;
    assignedTo?: string;
    assignedToUserId?: string;
    convertedToClientId?: string;
    visibilityScope?: "team" | "private";
    ownerUserId?: string;
    createdAt?: string;
  }>;

  return (
    <section>
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">Leads</h1>
      <LeadsTablePanel leads={leads} actorUid={actorUid} />
    </section>
  );
}
