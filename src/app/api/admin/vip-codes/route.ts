import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity/log";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { createVipCodeSchema } from "@/lib/validations/vip-admin";
import { isValidVipCodePattern, normalizeVipCode } from "@/lib/vip/normalize-code";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const snap = await adminDb.collection("vip_codes").orderBy("createdAt", "desc").limit(200).get();
    const codes = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, codes });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error al listar códigos.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = createVipCodeSchema.parse(body);
    const codeId = normalizeVipCode(parsed.code);

    if (!isValidVipCodePattern(codeId)) {
      return NextResponse.json(
        { ok: false, error: "El código debe ser letras y números (ej. JEAN20OFF), sin espacios." },
        { status: 400 },
      );
    }

    const expiresMs = new Date(parsed.expiresAt).getTime();
    if (Number.isNaN(expiresMs)) {
      return NextResponse.json({ ok: false, error: "Fecha de expiración inválida." }, { status: 400 });
    }

    const ref = adminDb.collection("vip_codes").doc(codeId);
    const existing = await ref.get();
    if (existing.exists) {
      return NextResponse.json({ ok: false, error: "Ya existe un código con ese identificador." }, { status: 409 });
    }

    const now = new Date().toISOString();
    await ref.set({
      code: codeId,
      active: parsed.active,
      maxUses: parsed.maxUses,
      usedCount: 0,
      expiresAt: new Date(parsed.expiresAt).toISOString(),
      notes: parsed.notes ?? "",
      createdAt: now,
      updatedAt: now,
      createdByUid: actor.uid,
    });

    await logAdminActivity({
      request,
      action: "vip_code_created",
      targetType: "vip_code",
      targetId: codeId,
      metadata: { maxUses: parsed.maxUses },
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true, codeId });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No se pudo crear el código.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
