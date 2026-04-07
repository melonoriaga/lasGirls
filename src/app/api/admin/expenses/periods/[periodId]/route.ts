import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computePeriodBalances } from "@/lib/expenses/balances";
import { listExpenseSharingMembers } from "@/lib/expenses/members";
import { ensurePeriodExists, parsePeriodId } from "@/lib/expenses/periods";
import { ensureRecurringExpensesGeneratedForPeriod } from "@/lib/expenses/recurrence";
import { listMovementsAll } from "@/lib/expenses/movements";

type Ctx = { params: Promise<{ periodId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { periodId } = await ctx.params;
  if (!parsePeriodId(periodId)) {
    return NextResponse.json({ ok: false, error: "periodId inválido." }, { status: 400 });
  }

  try {
    const members = await listExpenseSharingMembers();
    await ensurePeriodExists(adminDb, periodId);
    await ensureRecurringExpensesGeneratedForPeriod(adminDb, periodId, actor.uid);
    const movements = await listMovementsAll(adminDb, periodId);
    const balance = await computePeriodBalances(adminDb, periodId, members);
    const periodSnap = await adminDb.collection("expensePeriods").doc(periodId).get();
    const period = periodSnap.exists ? { id: periodSnap.id, ...(periodSnap.data() as Record<string, unknown>) } : null;

    const expenses = movements.filter((m) => m.type === "expense");
    const settlements = movements.filter((m) => m.type === "settlement");

    return NextResponse.json({
      ok: true,
      periodId,
      period,
      members,
      movements,
      expenses,
      settlements,
      balance,
    });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
