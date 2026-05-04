import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { logClientActivity } from "@/lib/clients/activity";
import { adminDb } from "@/lib/firebase/admin";
import { encryptAccountPassword } from "@/lib/security/account-secrets";

type Context = { params: Promise<{ id: string }> };

async function assertAccess(clientId: string, uid: string) {
  const clientSnap = await adminDb.collection("clients").doc(clientId).get();
  if (!clientSnap.exists) return { ok: false as const, status: 404, error: "Cliente inexistente." };
  if (!canAccessRecord(clientSnap.data() ?? {}, uid)) {
    return { ok: false as const, status: 403, error: "Sin permisos para este cliente." };
  }
  return { ok: true as const };
}

export async function GET(_request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const snap = await adminDb.collection("clients").doc(id).collection("accounts").orderBy("createdAt", "desc").limit(200).get();
  const items = snap.docs.map((doc) => {
    const data = doc.data() as Record<string, unknown>;
    return {
      id: doc.id,
      ...data,
      password: undefined,
      hasPassword: Boolean(String(data.password ?? "").trim()),
    };
  });
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const access = await assertAccess(id, actor.uid);
  if (!access.ok) return NextResponse.json({ ok: false, error: access.error }, { status: access.status });

  const body = (await request.json()) as Record<string, unknown>;
  const platform = String(body.platform ?? "").trim();
  const username = String(body.username ?? "").trim();
  if (!platform || !username) {
    return NextResponse.json({ ok: false, error: "Plataforma y usuario son obligatorios." }, { status: 400 });
  }

  const now = new Date().toISOString();
  const passwordPlain = String(body.password ?? "").trim();
  const ref = await adminDb.collection("clients").doc(id).collection("accounts").add({
    platform,
    username,
    password: passwordPlain ? encryptAccountPassword(passwordPlain) : "",
    url: String(body.url ?? "").trim(),
    notes: String(body.notes ?? "").trim(),
    createdAt: now,
    updatedAt: now,
    createdBy: actor.uid,
  });

  await logClientActivity({
    clientId: id,
    action: "account_added",
    createdByUserId: actor.uid,
    message: `${platform} · ${username}`,
    metadata: { accountId: ref.id },
  });

  return NextResponse.json({ ok: true, id: ref.id });
}
