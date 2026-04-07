import type { Firestore } from "firebase-admin/firestore";
import type { ExpenseMovement, ExpenseRecurrence } from "@/types/expenses";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { ensurePeriodExists, getCurrentPeriodId, parsePeriodId } from "@/lib/expenses/periods";
import { listPeriodIdsInRange, minPeriodId } from "@/lib/expenses/months";

function monthKeyCompare(a: string, b: string): number {
  return a.localeCompare(b);
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

function recurrenceAppliesToMonth(rec: ExpenseRecurrence, periodId: string): boolean {
  if (!rec.active) return false;
  if (monthKeyCompare(periodId, rec.startMonth) < 0) return false;
  if (rec.endMonth && monthKeyCompare(periodId, rec.endMonth) > 0) return false;
  return true;
}

/**
 * Idempotente: no duplica gasto generado para misma recurrencia en el mismo período.
 */
export async function ensureRecurringExpensesGeneratedForPeriod(
  db: Firestore,
  periodId: string,
  actorUid: string,
): Promise<{ created: number }> {
  const parsed = parsePeriodId(periodId);
  if (!parsed) return { created: 0 };

  await ensurePeriodExists(db, periodId);

  const recSnap = await db.collection("expenseRecurrences").get();
  const recurrences = recSnap.docs
    .map((d) => ({ id: d.id, ...(d.data() as Omit<ExpenseRecurrence, "id">) }))
    .filter((r) => recurrenceAppliesToMonth(r as ExpenseRecurrence, periodId)) as ExpenseRecurrence[];

  const movementsCol = db.collection("expensePeriods").doc(periodId).collection("movements");
  const existingSnap = await movementsCol.get();
  const generatedRecurrenceIds = new Set<string>();
  for (const d of existingSnap.docs) {
    const row = d.data() as ExpenseMovement;
    if (row.generatedByRecurrence && row.recurrenceId) generatedRecurrenceIds.add(row.recurrenceId);
  }

  let created = 0;
  const now = new Date().toISOString();

  for (const rec of recurrences) {
    if (generatedRecurrenceIds.has(rec.id)) continue;

    const { year, month } = parsed;
    const dom =
      rec.dayOfMonth && rec.dayOfMonth > 0
        ? Math.min(rec.dayOfMonth, daysInMonth(year, month))
        : Math.min(15, daysInMonth(year, month));
    const dateIso = new Date(year, month - 1, dom, 12, 0, 0, 0).toISOString();

    const participants = computeParticipantShares(rec.amount, rec.splitMode, rec.participants);

    const movement: Omit<ExpenseMovement, "id"> = {
      type: "expense",
      status: "active",
      title: rec.title,
      description: rec.description,
      category: rec.category,
      amount: rec.amount,
      currency: rec.currency,
      date: dateIso,
      paidByMemberId: rec.paidByMemberId,
      splitMode: rec.splitMode,
      participants,
      recurrenceId: rec.id,
      generatedByRecurrence: true,
      createdBy: rec.createdBy || actorUid,
      createdAt: now,
      updatedAt: now,
      canceledAt: null,
    };

    await movementsCol.add(movement);
    generatedRecurrenceIds.add(rec.id);
    created += 1;
  }

  if (created > 0) {
    await db.collection("expensePeriods").doc(periodId).set({ updatedAt: now }, { merge: true });
  }

  return { created };
}

/**
 * Genera (idempotente) en todos los períodos desde startMonth hasta hoy o endMonth.
 */
export async function ensureRecurrenceBackfillToPresent(
  db: Firestore,
  rec: ExpenseRecurrence,
  actorUid: string,
): Promise<{ periodsTouched: number; movementsCreated: number }> {
  const nowId = getCurrentPeriodId();
  const cap = rec.endMonth ? minPeriodId(rec.endMonth, nowId) : nowId;
  const ids = listPeriodIdsInRange(rec.startMonth, cap);
  let movementsCreated = 0;
  for (const pid of ids) {
    const r = await ensureRecurringExpensesGeneratedForPeriod(db, pid, actorUid);
    movementsCreated += r.created;
  }
  return { periodsTouched: ids.length, movementsCreated };
}

export async function listRecurrences(db: Firestore): Promise<ExpenseRecurrence[]> {
  const snap = await db.collection("expenseRecurrences").get();
  const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ExpenseRecurrence, "id">) }));
  return rows.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
