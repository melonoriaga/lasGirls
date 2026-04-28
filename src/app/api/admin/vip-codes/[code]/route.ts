import { NextResponse } from "next/server";
import { logAdminActivity } from "@/lib/activity/log";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { patchVipCodeSchema } from "@/lib/validations/vip-admin";
import { normalizeVipCode } from "@/lib/vip/normalize-code";

type Ctx = { params: Promise<{ code: string }> };

export async function PATCH(request: Request, context: Ctx) {
  const actor = await getSessionActor();
  if (!actor?.uid) {
    return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
  }

  try {
    const { code: rawParam } = await context.params;
    const codeId = normalizeVipCode(decodeURIComponent(rawParam));
    const body = await request.json();
    const parsed = patchVipCodeSchema.parse(body);

    const ref = adminDb.collection("vip_codes").doc(codeId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Código no encontrado." }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (parsed.maxUses !== undefined) updates.maxUses = parsed.maxUses;
    if (parsed.expiresAt !== undefined) {
      const ms = new Date(parsed.expiresAt).getTime();
      if (Number.isNaN(ms)) {
        return NextResponse.json({ ok: false, error: "Fecha inválida." }, { status: 400 });
      }
      updates.expiresAt = new Date(parsed.expiresAt).toISOString();
    }
    if (parsed.notes !== undefined) updates.notes = parsed.notes;
    if (parsed.active !== undefined) updates.active = parsed.active;

    await ref.update(updates);

    await logAdminActivity({
      request,
      action: "vip_code_updated",
      targetType: "vip_code",
      targetId: codeId,
      metadata: updates,
      fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "No se pudo actualizar.";
    return NextResponse.json({ ok: false, error: msg }, { status: 400 });
  }
}
