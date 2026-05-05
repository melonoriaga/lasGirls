import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { storedPasswordToPlain } from "@/lib/security/account-secrets";

export const runtime = "nodejs";

type Context = { params: Promise<{ id: string; accountId: string }> };

async function assertAccess(clientId: string, uid: string) {
  const clientSnap = await adminDb.collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(clientSnap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id, accountId } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.platform === "string") updates.platform = body.platform.trim();
  if (typeof body.username === "string") updates.username = body.username.trim();
  if (typeof body.password === "string") {
    updates.password = body.password.trim();
  }
  if (typeof body.url === "string") updates.url = body.url.trim();
  if (typeof body.notes === "string") updates.notes = body.notes.trim();

  await adminDb.collection("clients").doc(id).collection("accounts").doc(accountId).set(updates, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id, accountId } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const snap = await adminDb.collection("clients").doc(id).collection("accounts").doc(accountId).get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "Cuenta inexistente." }, { status: 404 });
  const data = snap.data() as Record<string, unknown>;
  return NextResponse.json({
    ok: true,
    password: storedPasswordToPlain(String(data.password ?? "")),
  });
}

export async function DELETE(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id, accountId } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  await adminDb.collection("clients").doc(id).collection("accounts").doc(accountId).delete();
  return NextResponse.json({ ok: true });
}
