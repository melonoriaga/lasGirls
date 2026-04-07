import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logAdminActivity } from "@/lib/activity/log";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

type Context = { params: Promise<{ id: string }> };

const getActor = async () => {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
};

export async function POST(request: Request, context: Context) {
  const actor = await getActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { id } = await context.params;
    const leadSnap = await adminDb.collection("leads").doc(id).get();
    if (!leadSnap.exists) {
      return NextResponse.json({ ok: false, error: "Lead inexistente." }, { status: 404 });
    }
    if (!canAccessRecord(leadSnap.data() ?? {}, actor.uid)) {
      return NextResponse.json({ ok: false, error: "Sin permisos para este lead." }, { status: 403 });
    }
    const body = (await request.json()) as { content?: string; type?: string; pinned?: boolean };
    const content = String(body.content ?? "").trim();
    const type = String(body.type ?? "internal_note").trim();
    const pinned = Boolean(body.pinned);

    if (!content) {
      return NextResponse.json({ ok: false, error: "La nota no puede estar vacía." }, { status: 400 });
    }

    await adminDb
      .collection("leads")
      .doc(id)
      .collection("notes")
      .add({
        content,
        type,
        pinned,
        createdBy: actor.email ?? actor.uid,
        createdAt: new Date().toISOString(),
      });

    await logAdminActivity({
      request,
      action: "lead_note_added",
      targetType: "lead",
      targetId: id,
      metadata: { type, pinned },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
