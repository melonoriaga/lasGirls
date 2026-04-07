import { parsePeriodId } from "@/lib/expenses/periods";

/** Period IDs inclusivos desde start hasta end (orden ascendente). */
export function listPeriodIdsInRange(startPeriodId: string, endPeriodId: string): string[] {
  const a = parsePeriodId(startPeriodId);
  const b = parsePeriodId(endPeriodId);
  if (!a || !b || startPeriodId > endPeriodId) return [];
  let y = a.year;
  let m = a.month;
  const out: string[] = [];
  while (true) {
    const id = `${y}-${String(m).padStart(2, "0")}`;
    if (id > endPeriodId) break;
    out.push(id);
    if (id === endPeriodId) break;
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
    if (out.length > 600) break;
  }
  return out;
}

export function minPeriodId(a: string, b: string): string {
  return a <= b ? a : b;
}
