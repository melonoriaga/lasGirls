import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

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
    .collection("activity")
    .orderBy("createdAt", "desc")
    .limit(100)
    .get();
  const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  return NextResponse.json({ ok: true, items });
}
