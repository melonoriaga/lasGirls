import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientLinkCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

async function assertClientAccess(id: string, uid: string) {
  const snap = await adminDb.collection("clients").doc(id).get();
  if (!snap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(snap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const access = await assertClientAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
  const snap = await adminDb
    .collection("clients")
    .doc(id)
    .collection("links")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  try {
    const { id } = await context.params;
    const access = await assertClientAccess(id, actor.uid);
    if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });
    const body = await request.json();
    const parsed = clientLinkCreateSchema.parse(body);
    const now = new Date().toISOString();
    await adminDb
      .collection("clients")
      .doc(id)
      .collection("links")
      .add({
        ...parsed,
        active: true,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actor.uid,
      });
    await incrementClientCounter(id, "usefulLinksCount", 1);
    await logClientActivity({
      clientId: id,
      action: "link_added",
      createdByUserId: actor.uid,
      message: parsed.title,
      metadata: { url: parsed.url, category: parsed.category },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
