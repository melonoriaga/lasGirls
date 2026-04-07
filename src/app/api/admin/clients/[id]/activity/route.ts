import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

type Context = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }
  const { id } = await context.params;
  const clientSnap = await adminDb.collection("clients").doc(id).get();
  if (!clientSnap.exists) {
    return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  }
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }
  const snap = await adminDb
    .collection("clients")
    .doc(id)
    .collection("activity")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ ok: true, items });
}
