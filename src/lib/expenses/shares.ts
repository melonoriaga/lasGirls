import type { ExpenseSplitMode, MovementParticipant, RecurrenceParticipant } from "@/types/expenses";

const EPS = 0.009;

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function computeParticipantShares(
  amount: number,
  splitMode: ExpenseSplitMode,
  participants: RecurrenceParticipant[],
): MovementParticipant[] {
  if (amount <= 0 || !Number.isFinite(amount)) {
    throw new Error("El monto debe ser mayor a 0.");
  }
  if (!participants.length) {
    throw new Error("Indicá al menos un participante.");
  }

  if (splitMode === "equal") {
    const n = participants.length;
    const each = amount / n;
    let sum = 0;
    const rows: MovementParticipant[] = participants.map((p, i) => {
      const isLast = i === n - 1;
      const share = isLast ? roundMoney(amount - sum) : roundMoney(each);
      sum += share;
      return {
        memberId: p.memberId,
        shareType: "percentage" as const,
        shareValue: roundMoney(100 / n),
        computedShareAmount: share,
      };
    });
    return rows;
  }

  const allPct = participants.every((p) => p.shareType === "percentage");
  if (allPct) {
    const sumPct = participants.reduce((s, p) => s + p.shareValue, 0);
    if (Math.abs(sumPct - 100) > EPS) {
      throw new Error("Los porcentajes deben sumar 100%.");
    }
    return participants.map((p) => ({
      memberId: p.memberId,
      shareType: "percentage",
      shareValue: p.shareValue,
      computedShareAmount: roundMoney((amount * p.shareValue) / 100),
    }));
  }

  const sumFixed = participants.reduce((s, p) => {
    if (p.shareType !== "fixed") throw new Error("En reparto personalizado, usá porcentajes o montos fijos homogéneos.");
    return s + p.shareValue;
  }, 0);
  if (Math.abs(sumFixed - amount) > EPS) {
    throw new Error("Los montos fijos deben sumar el total del gasto.");
  }
  return participants.map((p) => ({
    memberId: p.memberId,
    shareType: "fixed",
    shareValue: p.shareValue,
    computedShareAmount: roundMoney(p.shareValue),
  }));
}
