import type { Firestore } from "firebase-admin/firestore";
import type { ExpensePeriod } from "@/types/expenses";

export function getCurrentPeriodId(now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

export function parsePeriodId(periodId: string): { year: number; month: number } | null {
  const m = periodId.match(/^(\d{4})-(\d{2})$/);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

export function periodLabel(year: number, month: number, locale = "es-AR"): string {
  const d = new Date(year, month - 1, 1);
  return new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }).format(d).replace(/^\w/, (c) => c.toUpperCase());
}

export async function ensurePeriodExists(db: Firestore, periodId: string): Promise<ExpensePeriod> {
  const parsed = parsePeriodId(periodId);
  if (!parsed) throw new Error("periodId inválido (usar YYYY-MM).");
  const { year, month } = parsed;
  const ref = db.collection("expensePeriods").doc(periodId);
  const snap = await ref.get();
  const now = new Date().toISOString();
  const label = periodLabel(year, month);

  if (!snap.exists) {
    const doc: ExpensePeriod = {
      id: periodId,
      year,
      month,
      label,
      status: "open",
      createdAt: now,
      updatedAt: now,
    };
    await ref.set(doc);
    return doc;
  }

  const data = snap.data() as Partial<ExpensePeriod>;
  return {
    id: periodId,
    year: data.year ?? year,
    month: data.month ?? month,
    label: data.label ?? label,
    status: (data.status as ExpensePeriod["status"]) ?? "open",
    createdAt: String(data.createdAt ?? now),
    updatedAt: String(data.updatedAt ?? now),
  };
}
