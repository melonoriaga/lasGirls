import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { cancelExpenseMovement } from "@/lib/expenses/movements";

type Ctx = { params: Promise<{ periodId: string; movementId: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { periodId, movementId } = await ctx.params;

  try {
    const movement = await cancelExpenseMovement(adminDb, periodId, movementId);
    return NextResponse.json({ ok: true, movement });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
