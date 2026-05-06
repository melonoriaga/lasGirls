import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";
import { normalizePartnerLinkUrl } from "@/lib/partner-logos/validate-link";
import type { PartnerLogoRecord } from "@/lib/partner-logos/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const snap = await adminDb.collection("partnerLogos").orderBy("sortOrder", "asc").get();
  const items = snap.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as PartnerLogoRecord),
  }));
  return NextResponse.json({ ok: true, items });
}

export async function POST(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const imageUrl = String(body.imageUrl ?? "").trim();
  const storagePath = String(body.storagePath ?? "").trim();
  if (!imageUrl || !storagePath) {
    return NextResponse.json({ ok: false, error: "Falta URL de imagen o ruta en Storage." }, { status: 400 });
  }
  if (!storagePath.startsWith("partner/")) {
    return NextResponse.json({ ok: false, error: "La ruta debe vivir bajo partner/." }, { status: 400 });
  }

  const linkUrl = normalizePartnerLinkUrl(String(body.linkUrl ?? ""));
  const enabled = body.enabled === undefined ? true : Boolean(body.enabled);

  const ref = adminDb.collection("partnerLogos");
  const lastSnap = await ref.orderBy("sortOrder", "desc").limit(1).get();
  const nextOrder =
    lastSnap.empty ? 100 : Number((lastSnap.docs[0]!.data() as { sortOrder?: number }).sortOrder ?? 0) + 100;

  const now = new Date().toISOString();
  const docRef = ref.doc();
  const payload: PartnerLogoRecord = {
    imageUrl,
    storagePath,
    linkUrl,
    enabled,
    sortOrder: nextOrder,
    createdAt: now,
    updatedAt: now,
  };
  await docRef.set(payload);
  return NextResponse.json({ ok: true, id: docRef.id });
}
