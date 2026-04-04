import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { incrementClientCounter, logClientActivity } from "@/lib/clients/activity";
import { clientNoteCreateSchema } from "@/lib/validations/pipeline";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const snap = await adminDb
    .collection("clients")
    .doc(id)
    .collection("notes")
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
    const body = await request.json();
    const parsed = clientNoteCreateSchema.parse(body);
    const now = new Date().toISOString();
    await adminDb
      .collection("clients")
      .doc(id)
      .collection("notes")
      .add({
        content: parsed.content,
        type: parsed.type,
        createdAt: now,
        updatedAt: now,
        createdByUserId: actor.uid,
      });
    await incrementClientCounter(id, "notesCount", 1);
    await logClientActivity({
      clientId: id,
      action: "note_added",
      createdByUserId: actor.uid,
      message: parsed.type,
      metadata: { excerpt: parsed.content.slice(0, 120) },
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
