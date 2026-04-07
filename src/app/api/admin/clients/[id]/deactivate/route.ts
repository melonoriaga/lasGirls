import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { logAdminActivity } from "@/lib/activity/log";
import { adminDb } from "@/lib/firebase/admin";
import { logClientActivity } from "@/lib/clients/activity";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  const { id } = await context.params;
  const ref = adminDb.collection("clients").doc(id);
  const snap = await ref.get();
  if (!snap.exists) {
    return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  }
  if (!canAccessRecord(snap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const now = new Date().toISOString();
  await ref.set({ status: "inactive", updatedAt: now }, { merge: true });

  await logClientActivity({
    clientId: id,
    action: "client_deactivated",
    createdByUserId: actor.uid,
    message: "Cliente desactivado",
  });

  await logAdminActivity({
    request,
    action: "client_deactivated",
    targetType: "client",
    targetId: id,
    fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
  });

  return NextResponse.json({ ok: true });
}
