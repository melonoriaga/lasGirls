import type { Firestore } from "firebase-admin/firestore";
import type {
  CurrencyBalanceSummary,
  ExpenseMember,
  ExpenseMovement,
  MemberBalanceSummary,
  PeriodBalanceSummary,
} from "@/types/expenses";
import { memberNameMap } from "@/lib/expenses/member-display";

const EPS = 0.009;

export async function loadActiveMovements(
  db: Firestore,
  periodId: string,
): Promise<Array<ExpenseMovement & { id: string }>> {
  const snap = await db.collection("expensePeriods").doc(periodId).collection("movements").get();
  return snap.docs
    .map((d) => {
      const raw = d.data() as ExpenseMovement;
      const { id: _ignore, ...rest } = raw;
      return { id: d.id, ...rest };
    })
    .filter((m) => m.status === "active");
}

/**
 * Fuente de verdad: solo movimientos `active`.
 * Por moneda: net[m] = pagó_en_gastos - su_parte + settlements (from + / to -).
 */
export function computePeriodBalancesFromMovements(
  movements: Array<ExpenseMovement & { id: string }>,
  members: ExpenseMember[],
): PeriodBalanceSummary {
  const memberIds = members.map((m) => m.id);
  const names = memberNameMap(members);

  const currencies = new Set<string>();
  for (const mv of movements) {
    if (mv.currency) currencies.add(mv.currency);
  }

  const byCurrency: CurrencyBalanceSummary[] = [];

  for (const currency of [...currencies].sort()) {
    const net: Record<string, number> = Object.fromEntries(memberIds.map((id) => [id, 0]));
    let totalExpenses = 0;

    for (const mv of movements) {
      if (mv.currency !== currency) continue;

      if (mv.type === "expense") {
        totalExpenses += mv.amount;
        const payer = mv.paidByMemberId;
        const parts = mv.participants ?? [];
        if (payer) net[payer] = (net[payer] ?? 0) + mv.amount;
        for (const p of parts) {
          net[p.memberId] = (net[p.memberId] ?? 0) - p.computedShareAmount;
        }
      } else if (mv.type === "settlement") {
        const from = mv.fromMemberId;
        const to = mv.toMemberId;
        if (from) net[from] = (net[from] ?? 0) + mv.amount;
        if (to) net[to] = (net[to] ?? 0) - mv.amount;
      }
    }

    const memberRows: MemberBalanceSummary[] = memberIds.map((id) => {
      let paid = 0;
      let owedShare = 0;
      for (const mv of movements) {
        if (mv.currency !== currency || mv.type !== "expense") continue;
        if (mv.paidByMemberId === id) paid += mv.amount;
        const p = mv.participants?.find((x) => x.memberId === id);
        if (p) owedShare += p.computedShareAmount;
      }
      return {
        memberId: id,
        paid: round2(paid),
        owedShare: round2(owedShare),
        net: round2(net[id] ?? 0),
      };
    });

    const narrativeLines = buildDebtNarrative(memberIds, names, net, currency);
    const nonzero = memberIds.some((id) => Math.abs(net[id] ?? 0) > EPS);
    const isSaldado = !nonzero;

    byCurrency.push({
      currency,
      totalExpenses: round2(totalExpenses),
      members: memberRows,
      netByMemberId: Object.fromEntries(memberIds.map((id) => [id, round2(net[id] ?? 0)])),
      narrativeLines,
      isSaldado,
    });
  }

  const saldadoCount = byCurrency.filter((c) => c.isSaldado).length;
  const overallStatus: PeriodBalanceSummary["overallStatus"] =
    byCurrency.length === 0
      ? "saldado"
      : saldadoCount === byCurrency.length
        ? "saldado"
        : saldadoCount === 0
          ? "pendiente"
          : "mixto";

  return {
    periodId: "",
    byCurrency,
    overallStatus,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function buildDebtNarrative(
  memberIds: string[],
  names: Record<string, string>,
  net: Record<string, number>,
  currency: string,
): string[] {
  const nonzero = memberIds.filter((id) => Math.abs(net[id] ?? 0) > EPS);
  if (nonzero.length === 0) {
    return [`Balances saldados (${currency}).`];
  }
  if (nonzero.length === 2) {
    const [a, b] = nonzero;
    const na = net[a]!;
    const nb = net[b]!;
    if (na > 0 && nb < 0) {
      return [`${names[b] ?? b} le debe a ${names[a] ?? a} ${Math.abs(nb).toFixed(2)} ${currency}`];
    }
    if (na < 0 && nb > 0) {
      return [`${names[a] ?? a} le debe a ${names[b] ?? b} ${Math.abs(na).toFixed(2)} ${currency}`];
    }
  }
  return nonzero.map((id) => `${names[id] ?? id}: ${(net[id] ?? 0) >= 0 ? "+" : ""}${(net[id] ?? 0).toFixed(2)} ${currency}`);
}

export async function computePeriodBalances(
  db: Firestore,
  periodId: string,
  members: ExpenseMember[],
): Promise<PeriodBalanceSummary> {
  const movements = await loadActiveMovements(db, periodId);
  const summary = computePeriodBalancesFromMovements(movements, members);
  return { ...summary, periodId };
}
