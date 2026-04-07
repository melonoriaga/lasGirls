import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { leadStatusSchema } from "@/lib/validations/lead";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const body = (await request.json()) as { status: string };
    const status = leadStatusSchema.parse(body.status);
    await adminDb.collection("leads").doc(id).update({
      status,
      updatedAt: new Date().toISOString(),
    });
    await logAdminActivity({
      request,
      action: "lead_status_updated",
      targetType: "lead",
      targetId: id,
      metadata: { status },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
