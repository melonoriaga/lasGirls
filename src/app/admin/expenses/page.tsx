import { ExpensesMainPanel } from "@/components/admin/expenses/expenses-main-panel";
import { getSessionActor } from "@/lib/api/admin-session";

export default async function AdminExpensesPage() {
  const actor = await getSessionActor();
  return (
    <section>
      <ExpensesMainPanel actorUid={actor?.uid ?? ""} />
    </section>
  );
}
