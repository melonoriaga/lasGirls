import type { Firestore, QueryDocumentSnapshot } from "firebase-admin/firestore";
import { FieldPath } from "firebase-admin/firestore";
import type { ExpensePeriod } from "@/types/expenses";
import { buildPeriodHistoryRow } from "@/lib/expenses/history-summary";
import { listExpenseSharingMembers } from "@/lib/expenses/members";
import { listMovementsAll } from "@/lib/expenses/movements";

export type PaginatedPeriodHistory = {
  items: ReturnType<typeof buildPeriodHistoryRow>[];
  nextCursor: string | null;
  hasMore: boolean;
};

/**
 * Meses anteriores a `beforePeriodId`, orden desc por id (YYYY-MM).
 */
export async function listPastPeriodsPage(
  db: Firestore,
  beforePeriodId: string,
  pageSize: number,
  cursorId: string | null,
): Promise<PaginatedPeriodHistory> {
  const members = await listExpenseSharingMembers();

  let q = db
    .collection("expensePeriods")
    .where(FieldPath.documentId(), "<", beforePeriodId)
    .orderBy(FieldPath.documentId(), "desc")
    .limit(pageSize + 1);

  if (cursorId) {
    const cursorSnap = await db.collection("expensePeriods").doc(cursorId).get();
    if (cursorSnap.exists) {
      q = q.startAfter(cursorSnap);
    }
  }

  const snap = await q.get();
  const docs = snap.docs;
  const hasMore = docs.length > pageSize;
  const slice = hasMore ? docs.slice(0, pageSize) : docs;

  const items: PaginatedPeriodHistory["items"] = [];
  for (const d of slice) {
    const period = { id: d.id, ...(d.data() as Omit<ExpensePeriod, "id">) };
    const movements = await listMovementsAll(db, period.id);
    items.push(buildPeriodHistoryRow(period.id, period.label, movements, members));
  }

  const last = slice[slice.length - 1];
  const nextCursor = hasMore && last ? last.id : null;

  return { items, nextCursor, hasMore };
}

/** Todos los miembros (para APIs que ya cargaron members). */
export async function buildHistoryRowsForDocs(
  db: Firestore,
  docs: QueryDocumentSnapshot[],
  members: Awaited<ReturnType<typeof listExpenseSharingMembers>>,
): Promise<PaginatedPeriodHistory["items"]> {
  const items: PaginatedPeriodHistory["items"] = [];
  for (const d of docs) {
    const period = { id: d.id, ...(d.data() as Omit<ExpensePeriod, "id">) };
    const movements = await listMovementsAll(db, period.id);
    items.push(buildPeriodHistoryRow(period.id, period.label, movements, members));
  }
  return items;
}
