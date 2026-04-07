import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { assertExpenseMemberIdsInTeam, listExpenseSharingMembers } from "@/lib/expenses/members";
import { memberNameMap } from "@/lib/expenses/member-display";
import { createExpenseMovement, createSettlementMovement } from "@/lib/expenses/movements";
import { postMovementSchema } from "@/lib/validations/expenses";

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = postMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const team = await listExpenseSharingMembers();
    if (parsed.data.kind === "expense") {
      const e = parsed.data;
      assertExpenseMemberIdsInTeam(
        [e.paidByMemberId, ...e.participants.map((x) => x.memberId)],
        team,
      );
      computeParticipantShares(e.amount, e.splitMode, e.participants);
      const movement = await createExpenseMovement(adminDb, {
        periodId: e.periodId,
        title: e.title,
        description: e.description,
        category: e.category,
        amount: e.amount,
        currency: e.currency,
        dateInput: e.date,
        paidByMemberId: e.paidByMemberId,
        splitMode: e.splitMode,
        participants: e.participants,
        actorUid: actor.uid,
      });
      return NextResponse.json({ ok: true, movement });
    }

    const s = parsed.data;
    assertExpenseMemberIdsInTeam([s.fromMemberId, s.toMemberId], team);
    const names = memberNameMap(team);
    const fromN = names[s.fromMemberId] ?? s.fromMemberId;
    const toN = names[s.toMemberId] ?? s.toMemberId;
    const displayTitle = s.note?.trim() ? undefined : `Pago: ${fromN} → ${toN}`;
    const movement = await createSettlementMovement(adminDb, {
      periodId: s.periodId,
      fromMemberId: s.fromMemberId,
      toMemberId: s.toMemberId,
      amount: s.amount,
      currency: s.currency,
      dateInput: s.date,
      note: s.note,
      displayTitle,
      actorUid: actor.uid,
    });
    return NextResponse.json({ ok: true, movement });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }
}
