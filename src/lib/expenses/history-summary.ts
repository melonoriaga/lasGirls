import type { ExpenseMember, ExpenseMovement, PeriodBalanceSummary } from "@/types/expenses";
import { computePeriodBalancesFromMovements } from "@/lib/expenses/balances";
export type PeriodHistoryRow = {
  periodId: string;
  label: string;
  currencies: string[];
  totalExpensesByCurrency: Record<string, number>;
  memberPaidByCurrency: Record<string, Record<string, number>>;
  balanceSummary: PeriodBalanceSummary;
  balanceText: string;
  /** Movimientos activos en el mes (para tabla resumen). */
  activeExpenseCount: number;
  activeSettlementCount: number;
};

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function fmtTotals(byCurr: Record<string, number>): string {
  const keys = Object.keys(byCurr).sort();
  if (!keys.length) return "—";
  return keys.map((c) => `${c} ${byCurr[c]!.toFixed(2)}`).join(" · ");
}

/** Construye fila de historial a partir de todos los movimientos (incl. anulados para UI si hace falta). */
export function buildPeriodHistoryRow(
  periodId: string,
  label: string,
  movements: Array<ExpenseMovement & { id: string }>,
  members: ExpenseMember[],
): PeriodHistoryRow {
  const active = movements.filter((m) => m.status === "active");

  const totalExpensesByCurrency: Record<string, number> = {};
  const memberPaidByCurrency: Record<string, Record<string, number>> = {};
  for (const m of members) {
    memberPaidByCurrency[m.id] = {};
  }

  for (const mv of active) {
    if (mv.type !== "expense") continue;
    const c = mv.currency;
    totalExpensesByCurrency[c] = round2((totalExpensesByCurrency[c] ?? 0) + mv.amount);
    const payer = mv.paidByMemberId;
    if (payer) {
      const bucket = memberPaidByCurrency[payer] ?? {};
      bucket[c] = round2((bucket[c] ?? 0) + mv.amount);
      memberPaidByCurrency[payer] = bucket;
    }
  }

  const balanceSummary = computePeriodBalancesFromMovements(active, members);
  const withId = { ...balanceSummary, periodId };

  const lines: string[] = [];
  for (const block of withId.byCurrency) {
    const narr = block.narrativeLines[0] ?? "";
    lines.push(`${block.currency}: ${narr}`);
  }
  const balanceText = lines.length ? lines.join(" | ") : "Sin movimientos activos.";
  const activeExpenseCount = active.filter((m) => m.type === "expense").length;
  const activeSettlementCount = active.filter((m) => m.type === "settlement").length;

  return {
    periodId,
    label,
    currencies: Object.keys(totalExpensesByCurrency).sort(),
    totalExpensesByCurrency,
    memberPaidByCurrency,
    balanceSummary: withId,
    balanceText,
    activeExpenseCount,
    activeSettlementCount,
  };
}

export function formatMemberPaidAcrossCurrencies(
  byMemberCur: Record<string, Record<string, number>>,
  memberId: string,
): string {
  const inner = byMemberCur[memberId] ?? {};
  return fmtTotals(inner);
}

export function memberShortLabel(memberId: string, names: Record<string, string>): string {
  return names[memberId] ?? memberId;
}
