import type { Firestore } from "firebase-admin/firestore";
import type { ExpenseRecurrence } from "@/types/expenses";
import { ensureRecurrenceBackfillToPresent } from "@/lib/expenses/recurrence";
import { getCurrentPeriodId } from "@/lib/expenses/periods";
import { minPeriodId } from "@/lib/expenses/months";

function omitUndefined<T extends Record<string, unknown>>(obj: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, v]) => v !== undefined),
  ) as Partial<T>;
}

export async function createRecurrenceDoc(
  db: Firestore,
  data: Omit<ExpenseRecurrence, "id" | "createdAt" | "updatedAt">,
  actorUid: string,
): Promise<ExpenseRecurrence> {
  const now = new Date().toISOString();
  const id = db.collection("expenseRecurrences").doc().id;
  const doc: ExpenseRecurrence = {
    ...data,
    id,
    createdBy: data.createdBy || actorUid,
    createdAt: now,
    updatedAt: now,
  };
  await db.collection("expenseRecurrences").doc(id).set(doc);
  await ensureRecurrenceBackfillToPresent(db, doc, actorUid);
  return doc;
}

export async function updateRecurrenceDoc(
  db: Firestore,
  recurrenceId: string,
  patch: Partial<Omit<ExpenseRecurrence, "id" | "createdAt">>,
  actorUid: string,
): Promise<ExpenseRecurrence> {
  const ref = db.collection("expenseRecurrences").doc(recurrenceId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Recurrencia no encontrada.");
  const cur = { id: snap.id, ...(snap.data() as Omit<ExpenseRecurrence, "id">) };
  const now = new Date().toISOString();
  const { id: _rid, ...rest } = cur;
  const merged: ExpenseRecurrence = {
    ...rest,
    ...(omitUndefined(patch as Record<string, unknown>) as Partial<ExpenseRecurrence>),
    id: recurrenceId,
    updatedAt: now,
    createdBy: rest.createdBy || actorUid,
  };
  await ref.set(merged, { merge: true });
  if (merged.active) {
    await ensureRecurrenceBackfillToPresent(db, merged, actorUid);
  }
  return merged;
}

export async function deactivateRecurrenceDoc(
  db: Firestore,
  recurrenceId: string,
  opts?: { endMonth?: string },
): Promise<ExpenseRecurrence> {
  const ref = db.collection("expenseRecurrences").doc(recurrenceId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Recurrencia no encontrada.");
  const cur = { id: snap.id, ...(snap.data() as Omit<ExpenseRecurrence, "id">) };
  const now = new Date().toISOString();
  const thisMonth = getCurrentPeriodId();
  const endMonth = opts?.endMonth ? minPeriodId(opts.endMonth, thisMonth) : thisMonth;
  const merged: ExpenseRecurrence = {
    ...cur,
    id: recurrenceId,
    active: false,
    endMonth: cur.endMonth ? minPeriodId(cur.endMonth, endMonth) : endMonth,
    canceledAt: now,
    updatedAt: now,
  };
  await ref.set(merged, { merge: true });
  return merged;
}
