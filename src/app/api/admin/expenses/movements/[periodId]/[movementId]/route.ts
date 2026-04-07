import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { deleteOwnMovementByCreator, updateExpenseMovement } from "@/lib/expenses/movements";
import { updateExpenseMovementSchema } from "@/lib/validations/expenses";
import { assertExpenseMemberIdsInTeam, listExpenseSharingMembers } from "@/lib/expenses/members";

type Ctx = { params: Promise<{ periodId: string; movementId: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { periodId, movementId } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateExpenseMovementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const p = parsed.data;
  try {
    const snapPre = await adminDb.collection("expensePeriods").doc(periodId).collection("movements").doc(movementId).get();
    if (!snapPre.exists) {
      return NextResponse.json({ ok: false, error: "Movimiento no encontrado." }, { status: 404 });
    }
    const curPre = snapPre.data();

    if (p.participants && p.amount !== undefined && p.splitMode) {
      computeParticipantShares(p.amount, p.splitMode, p.participants);
    } else if (p.participants || p.splitMode || p.amount !== undefined) {
      const cur = snapPre.data();
      const amt = p.amount ?? Number(cur?.amount);
      const mode = p.splitMode ?? (cur?.splitMode as "equal" | "custom") ?? "equal";
      const parts = p.participants ?? (cur?.participants as { memberId: string; shareType: "percentage" | "fixed"; shareValue: number }[]) ?? [];
      computeParticipantShares(amt, mode, parts);
    }

    const team = await listExpenseSharingMembers();
    const paidBy = p.paidByMemberId ?? (curPre?.paidByMemberId as string | undefined) ?? "";
    const partsMerged =
      p.participants ??
      (curPre?.participants as { memberId: string; shareType: "percentage" | "fixed"; shareValue: number }[]) ??
      [];
    assertExpenseMemberIdsInTeam([paidBy, ...partsMerged.map((x) => x.memberId)], team);

    const movement = await updateExpenseMovement(
      adminDb,
      periodId,
      movementId,
      {
        title: p.title,
        description: p.description,
        category: p.category,
        amount: p.amount,
        currency: p.currency,
        dateInput: p.date,
        paidByMemberId: p.paidByMemberId,
        splitMode: p.splitMode,
        participants: p.participants,
      },
      actor.uid,
    );
    return NextResponse.json({ ok: true, movement });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { periodId, movementId } = await ctx.params;

  try {
    await deleteOwnMovementByCreator(adminDb, periodId, movementId, actor.uid);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const msg = (e as Error).message;
    if (
      msg === "Solo quien registró este movimiento puede eliminarlo." ||
      msg === "Solo quien registró este gasto puede eliminarlo."
    ) {
      return NextResponse.json({ ok: false, error: msg }, { status: 403 });
    }
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
