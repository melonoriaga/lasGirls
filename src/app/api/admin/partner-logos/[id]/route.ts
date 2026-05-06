import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { normalizePartnerLinkUrl } from "@/lib/partner-logos/validate-link";
import type { PartnerLogoRecord } from "@/lib/partner-logos/types";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const ref = adminDb.collection("partnerLogos").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });

  const body = (await request.json()) as Record<string, unknown>;
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };

  if ("linkUrl" in body) {
    updates.linkUrl = normalizePartnerLinkUrl(String(body.linkUrl ?? ""));
  }
  if ("enabled" in body) {
    updates.enabled = Boolean(body.enabled);
  }
  if ("imageUrl" in body || "storagePath" in body) {
    const imageUrl = String(body.imageUrl ?? "").trim();
    const storagePath = String(body.storagePath ?? "").trim();
    if (!imageUrl || !storagePath) {
      return NextResponse.json({ ok: false, error: "URL y ruta son obligatorias al actualizar archivo." }, { status: 400 });
    }
    if (!storagePath.startsWith("partner/")) {
      return NextResponse.json({ ok: false, error: "La ruta debe vivir bajo partner/." }, { status: 400 });
    }
    updates.imageUrl = imageUrl;
    updates.storagePath = storagePath;
  }

  await ref.set(updates, { merge: true });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const ref = adminDb.collection("partnerLogos").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ ok: false, error: "No encontrado." }, { status: 404 });

  const data = snap.data() as PartnerLogoRecord;
  const storagePath = String(data.storagePath ?? "").trim();
  if (storagePath.startsWith("partner/")) {
    try {
      const bucket = adminStorage.bucket();
      await bucket.file(storagePath).delete({ ignoreNotFound: true });
    } catch (e) {
      console.error("[DELETE partner logo storage]", e);
    }
  }

  await ref.delete();
  return NextResponse.json({ ok: true });
}
