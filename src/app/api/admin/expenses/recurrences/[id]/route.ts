import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { updateRecurrenceSchema } from "@/lib/validations/expenses";
import { updateRecurrenceDoc } from "@/lib/expenses/recurrences-crud";
import { assertExpenseMemberIdsInTeam, listExpenseSharingMembers } from "@/lib/expenses/members";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateRecurrenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const p = parsed.data;
  try {
    if (p.amount != null && p.splitMode && p.participants) {
      computeParticipantShares(p.amount, p.splitMode, p.participants);
    }
    const team = await listExpenseSharingMembers();
    const ids: string[] = [];
    if (p.paidByMemberId) ids.push(p.paidByMemberId);
    if (p.participants?.length) ids.push(...p.participants.map((x) => x.memberId));
    if (ids.length) assertExpenseMemberIdsInTeam(ids, team);

    const item = await updateRecurrenceDoc(adminDb, id, p, actor.uid);
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
