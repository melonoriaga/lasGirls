import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computePeriodBalances } from "@/lib/expenses/balances";
import { listExpenseSharingMembers } from "@/lib/expenses/members";
import { getCurrentPeriodId, ensurePeriodExists } from "@/lib/expenses/periods";
import { ensureRecurringExpensesGeneratedForPeriod } from "@/lib/expenses/recurrence";
import { listMovementsAll } from "@/lib/expenses/movements";

export async function GET(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const periodParam = searchParams.get("periodId")?.trim();
  const periodId = periodParam && /^\d{4}-\d{2}$/.test(periodParam) ? periodParam : getCurrentPeriodId();

  try {
    const members = await listExpenseSharingMembers();
    await ensurePeriodExists(adminDb, periodId);
    await ensureRecurringExpensesGeneratedForPeriod(adminDb, periodId, actor.uid);
    const movements = await listMovementsAll(adminDb, periodId);
    const balance = await computePeriodBalances(adminDb, periodId, members);
    const periodSnap = await adminDb.collection("expensePeriods").doc(periodId).get();
    const period = periodSnap.exists ? { id: periodSnap.id, ...(periodSnap.data() as Record<string, unknown>) } : null;

    return NextResponse.json({
      ok: true,
      periodId,
      period,
      members,
      movements,
      balance,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
