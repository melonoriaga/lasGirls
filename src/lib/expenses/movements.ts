import type { Firestore } from "firebase-admin/firestore";
import type { ExpenseMovement, ExpenseSplitMode, RecurrenceParticipant } from "@/types/expenses";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { normalizeMovementDateInput, periodIdFromMovementDate } from "@/lib/expenses/dates";
import { ensurePeriodExists } from "@/lib/expenses/periods";

export type MovementDoc = ExpenseMovement & { id: string };

function sortByDateDesc(a: MovementDoc, b: MovementDoc): number {
  const byCreatedAt = String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? ""));
  if (byCreatedAt !== 0) return byCreatedAt;
  const byDate = String(b.date ?? "").localeCompare(String(a.date ?? ""));
  if (byDate !== 0) return byDate;
  return String(b.id).localeCompare(String(a.id));
}

export async function listMovementsAll(db: Firestore, periodId: string): Promise<MovementDoc[]> {
  const snap = await db.collection("expensePeriods").doc(periodId).collection("movements").get();
  const rows = snap.docs.map((d) => {
    const raw = d.data() as ExpenseMovement;
    const { id: _ignore, ...rest } = raw;
    return { id: d.id, ...rest };
  });
  return rows.sort(sortByDateDesc);
}

export async function createExpenseMovement(
  db: Firestore,
  params: {
    periodId: string;
    title: string;
    description?: string;
    category?: string;
    amount: number;
    currency: string;
    dateInput: string;
    paidByMemberId: string;
    splitMode: ExpenseSplitMode;
    participants: RecurrenceParticipant[];
    actorUid: string;
  },
): Promise<MovementDoc> {
  const date = normalizeMovementDateInput(params.dateInput);
  const derivedPeriod = periodIdFromMovementDate(date);
  if (derivedPeriod !== params.periodId) {
    throw new Error("El mes del movimiento no coincide con el período seleccionado.");
  }

  await ensurePeriodExists(db, params.periodId);
  const participants = computeParticipantShares(params.amount, params.splitMode, params.participants);
  const now = new Date().toISOString();
  const payload: Omit<ExpenseMovement, "id"> = {
    type: "expense",
    status: "active",
    title: params.title.trim(),
    description: params.description?.trim() || undefined,
    category: params.category,
    amount: params.amount,
    currency: params.currency,
    date,
    paidByMemberId: params.paidByMemberId,
    splitMode: params.splitMode,
    participants,
    recurrenceId: null,
    generatedByRecurrence: false,
    createdBy: params.actorUid,
    createdAt: now,
    updatedAt: now,
    canceledAt: null,
  };

  const ref = await db.collection("expensePeriods").doc(params.periodId).collection("movements").add(payload);
  return { id: ref.id, ...payload };
}

export async function createSettlementMovement(
  db: Firestore,
  params: {
    periodId: string;
    fromMemberId: string;
    toMemberId: string;
    amount: number;
    currency: string;
    dateInput: string;
    note?: string;
    displayTitle?: string;
    actorUid: string;
  },
): Promise<MovementDoc> {
  const date = normalizeMovementDateInput(params.dateInput);
  const derivedPeriod = periodIdFromMovementDate(date);
  if (derivedPeriod !== params.periodId) {
    throw new Error("El mes del pago no coincide con el período seleccionado.");
  }
  if (params.fromMemberId === params.toMemberId) {
    throw new Error("Origen y destino del pago deben ser distintos.");
  }

  await ensurePeriodExists(db, params.periodId);
  const now = new Date().toISOString();
  const title =
    params.displayTitle?.trim() ||
    params.note?.trim() ||
    `Pago (${params.fromMemberId} → ${params.toMemberId})`;
  const payload: Omit<ExpenseMovement, "id"> = {
    type: "settlement",
    status: "active",
    title,
    description: params.note?.trim() || undefined,
    amount: params.amount,
    currency: params.currency,
    date,
    fromMemberId: params.fromMemberId,
    toMemberId: params.toMemberId,
    recurrenceId: null,
    generatedByRecurrence: false,
    createdBy: params.actorUid,
    createdAt: now,
    updatedAt: now,
    canceledAt: null,
  };

  const ref = await db.collection("expensePeriods").doc(params.periodId).collection("movements").add(payload);
  return { id: ref.id, ...payload };
}

export async function updateExpenseMovement(
  db: Firestore,
  periodId: string,
  movementId: string,
  patch: {
    title?: string;
    description?: string;
    category?: string;
    amount?: number;
    currency?: string;
    dateInput?: string;
    paidByMemberId?: string;
    splitMode?: ExpenseSplitMode;
    participants?: RecurrenceParticipant[];
  },
  actorUid: string,
): Promise<MovementDoc> {
  const ref = db.collection("expensePeriods").doc(periodId).collection("movements").doc(movementId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Movimiento no encontrado.");
  const raw = snap.data() as ExpenseMovement;
  const { id: _storedId, ...body } = raw;
  const cur: ExpenseMovement & { id: string } = { id: snap.id, ...body };
  if (cur.status !== "active") throw new Error("Solo se pueden editar movimientos activos.");
  if (cur.type !== "expense") throw new Error("Solo se pueden editar gastos con esta acción.");
  const { id: _mid, ...curRest } = cur;

  const nextAmount = patch.amount ?? cur.amount;
  const nextCurrency = (patch.currency ?? cur.currency).toUpperCase();
  const nextSplit = patch.splitMode ?? cur.splitMode ?? "equal";
  const nextParticipantsRaw = patch.participants ?? (cur.participants as RecurrenceParticipant[]) ?? [];
  const nextParticipants = computeParticipantShares(nextAmount, nextSplit, nextParticipantsRaw);

  let nextDate = cur.date;
  if (patch.dateInput) {
    nextDate = normalizeMovementDateInput(patch.dateInput);
    if (periodIdFromMovementDate(nextDate) !== periodId) {
      throw new Error("La nueva fecha pertenece a otro período; anulá y creá un movimiento nuevo.");
    }
  }

  const now = new Date().toISOString();
  const merged: Omit<ExpenseMovement, "id"> = {
    ...curRest,
    title: patch.title?.trim() ?? cur.title,
    description: patch.description !== undefined ? patch.description.trim() || undefined : cur.description,
    category: patch.category !== undefined ? patch.category : cur.category,
    amount: nextAmount,
    currency: nextCurrency,
    date: nextDate,
    paidByMemberId: patch.paidByMemberId ?? cur.paidByMemberId,
    splitMode: nextSplit,
    participants: nextParticipants,
    updatedAt: now,
  };

  await ref.set(merged, { merge: true });
  return { id: movementId, ...merged };
}

export async function cancelExpenseMovement(
  db: Firestore,
  periodId: string,
  movementId: string,
): Promise<MovementDoc> {
  const ref = db.collection("expensePeriods").doc(periodId).collection("movements").doc(movementId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error("Movimiento no encontrado.");
  const raw = snap.data() as ExpenseMovement;
  const { id: _sid, ...body } = raw;
  const cur: ExpenseMovement & { id: string } = { id: snap.id, ...body };
  if (cur.status !== "active") return cur;
  const { id: _cid, ...rest } = cur;
  const now = new Date().toISOString();
  const payload = { ...rest, status: "canceled" as const, canceledAt: now, updatedAt: now };
  await ref.set(payload, { merge: true });
  return { id: movementId, ...payload };
}

/**
 * Borrado en Firestore: permite `expense` y `settlement`, solo si `createdBy` coincide con quien pide la acción.
 */
export async function deleteOwnMovementByCreator(
  db: Firestore,
  periodId: string,
  movementId: string,
  actorUid: string,
): Promise<void> {
  const ref = db.collection("expensePeriods").doc(periodId).collection("movements").doc(movementId);
  try {
    const snap = await ref.get();
    if (!snap.exists) throw new Error("Movimiento no encontrado.");
    const raw = snap.data() as ExpenseMovement;
    if (raw.type !== "expense" && raw.type !== "settlement") {
      throw new Error("Solo se pueden eliminar gastos o pagos.");
    }
    if (raw.createdBy !== actorUid) {
      throw new Error("Solo quien registró este movimiento puede eliminarlo.");
    }
    await ref.delete();
    const now = new Date().toISOString();
    await db.collection("expensePeriods").doc(periodId).set({ updatedAt: now }, { merge: true });
  } catch (e) {
    const msg = (e as Error).message || String(e);
    if (msg.includes("FAILED_PRECONDITION") || msg.toLowerCase().includes("requires an index")) {
      throw new Error(`Firestore pidió índice al eliminar movimiento: ${msg}`);
    }
    throw e;
  }
}

/**
 * Backward compatible alias (antes sólo eliminaba gastos).
 */
export const deleteExpenseMovementByCreator = deleteOwnMovementByCreator;
