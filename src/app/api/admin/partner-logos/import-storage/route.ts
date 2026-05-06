import { NextResponse } from "next/server";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import type { PartnerLogoRecord } from "@/lib/partner-logos/types";

export const dynamic = "force-dynamic";

function buildDownloadUrl(bucketName: string, storagePath: string, token: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(storagePath)}?alt=media&token=${token}`;
}

export async function POST() {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  try {
    const collection = adminDb.collection("partnerLogos");
    const [existingSnap, orderSnap] = await Promise.all([
      collection.get(),
      collection.orderBy("sortOrder", "desc").limit(1).get(),
    ]);

    const existingPaths = new Set(
      existingSnap.docs.map((doc) => String((doc.data() as { storagePath?: string }).storagePath ?? "")),
    );

    let nextOrder = orderSnap.empty
      ? 100
      : Number((orderSnap.docs[0]!.data() as { sortOrder?: number }).sortOrder ?? 0) + 100;

    const bucket = adminStorage.bucket();
    const [files] = await bucket.getFiles({ prefix: "partner/" });

    let imported = 0;
    let skippedExisting = 0;
    let skippedInvalid = 0;

    for (const file of files) {
      const storagePath = String(file.name ?? "").trim();
      if (!storagePath || storagePath.endsWith("/")) continue;
      if (existingPaths.has(storagePath)) {
        skippedExisting += 1;
        continue;
      }

      const [meta] = await file.getMetadata();
      const contentType = String(meta.contentType ?? "");
      if (!contentType.startsWith("image/")) {
        skippedInvalid += 1;
        continue;
      }

      const tokensRaw = String((meta.metadata as { firebaseStorageDownloadTokens?: string } | undefined)?.firebaseStorageDownloadTokens ?? "").trim();
      const token = tokensRaw.split(",").map((x) => x.trim()).find(Boolean) ?? "";
      if (!token) {
        skippedInvalid += 1;
        continue;
      }

      const now = new Date().toISOString();
      const payload: PartnerLogoRecord = {
        imageUrl: buildDownloadUrl(bucket.name, storagePath, token),
        storagePath,
        linkUrl: "",
        enabled: true,
        sortOrder: nextOrder,
        createdAt: now,
        updatedAt: now,
      };

      await collection.doc().set(payload);
      existingPaths.add(storagePath);
      imported += 1;
      nextOrder += 100;
    }

    return NextResponse.json({
      ok: true,
      imported,
      skippedExisting,
      skippedInvalid,
    });
  } catch (error) {
    console.error("[POST /api/admin/partner-logos/import-storage]", error);
    return NextResponse.json({ ok: false, error: "No se pudo importar desde Storage." }, { status: 500 });
  }
}
