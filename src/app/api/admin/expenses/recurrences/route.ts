import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { computeParticipantShares } from "@/lib/expenses/shares";
import { createRecurrenceSchema } from "@/lib/validations/expenses";
import { createRecurrenceDoc } from "@/lib/expenses/recurrences-crud";
import { listRecurrences } from "@/lib/expenses/recurrence";
import { assertExpenseMemberIdsInTeam, listExpenseSharingMembers } from "@/lib/expenses/members";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const items = await listRecurrences(adminDb);
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

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

  const parsed = createRecurrenceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: parsed.error.flatten() }, { status: 400 });
  }

  const r = parsed.data;
  try {
    const team = await listExpenseSharingMembers();
    assertExpenseMemberIdsInTeam(
      [r.paidByMemberId, ...r.participants.map((x) => x.memberId)],
      team,
    );
    computeParticipantShares(r.amount, r.splitMode, r.participants);
    const item = await createRecurrenceDoc(
      adminDb,
      {
        title: r.title,
        description: r.description,
        category: r.category,
        amount: r.amount,
        currency: r.currency,
        paidByMemberId: r.paidByMemberId,
        splitMode: r.splitMode,
        participants: r.participants,
        frequency: "monthly",
        startMonth: r.startMonth,
        endMonth: r.endMonth ?? null,
        dayOfMonth: r.dayOfMonth ?? null,
        active: true,
        createdBy: actor.uid,
        canceledAt: null,
      },
      actor.uid,
    );
    return NextResponse.json({ ok: true, item });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
