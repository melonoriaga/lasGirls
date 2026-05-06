import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb } from "@/lib/firebase/admin";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const body = (await request.json()) as Record<string, unknown>;
  const orderedIds = body.orderedIds;
  if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== "string")) {
    return NextResponse.json({ ok: false, error: "orderedIds debe ser un array de strings." }, { status: 400 });
  }

  const batch = adminDb.batch();
  orderedIds.forEach((id, index) => {
    batch.update(adminDb.collection("partnerLogos").doc(id), {
      sortOrder: index * 100,
      updatedAt: new Date().toISOString(),
    });
  });
  await batch.commit();
  return NextResponse.json({ ok: true });
}
