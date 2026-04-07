import { notFound } from "next/navigation";
import { ExpensesPeriodDetailPanel } from "@/components/admin/expenses/expenses-period-detail-panel";
import { getSessionActor } from "@/lib/api/admin-session";

const PERIOD_RE = /^\d{4}-\d{2}$/;

type Props = { params: Promise<{ periodId: string }> };

export default async function AdminExpensePeriodPage(props: Props) {
  const { periodId } = await props.params;
  if (!PERIOD_RE.test(periodId)) notFound();

  const actor = await getSessionActor();

  return (
    <section>
      <ExpensesPeriodDetailPanel periodId={periodId} actorUid={actor?.uid ?? ""} />
    </section>
  );
}
