import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { canAccessRecord } from "@/lib/admin/record-visibility";
import { getSessionActor } from "@/lib/api/admin-session";
import { adminDb, adminStorage } from "@/lib/firebase/admin";
import { logClientActivity } from "@/lib/clients/activity";

type Context = { params: Promise<{ id: string }> };

export async function POST(request: Request, context: Context) {
  const actor = await getSessionActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const { id } = await context.params;
  const clientRef = adminDb.collection("clients").doc(id);
  const clientSnap = await clientRef.get();
  if (!clientSnap.exists) {
    return NextResponse.json({ ok: false, error: "Cliente inexistente." }, { status: 404 });
  }
  if (!canAccessRecord(clientSnap.data() ?? {}, actor.uid)) {
    return NextResponse.json({ ok: false, error: "Sin permisos para este cliente." }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Archivo inválido." }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ ok: false, error: "Solo se permiten imágenes." }, { status: 400 });
  }
  if (file.size > 1024 * 1024) {
    return NextResponse.json({ ok: false, error: "La imagen supera el máximo de 1MB." }, { status: 400 });
  }

  const ext = file.name.split(".").pop()?.toLowerCase() || "png";
  const safeExt = ext.replace(/[^a-z0-9]/g, "") || "png";
  const objectPath = `clients/${id}/logo-${Date.now()}-${randomUUID()}.${safeExt}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  const token = randomUUID();
  const bucket = adminStorage.bucket();
  const object = bucket.file(objectPath);

  await object.save(bytes, {
    contentType: file.type,
    resumable: false,
    metadata: {
      cacheControl: "public,max-age=31536000,immutable",
      metadata: {
        firebaseStorageDownloadTokens: token,
        uploadedBy: actor.uid,
        clientId: id,
      },
    },
  });

  const encodedPath = encodeURIComponent(objectPath);
  const logoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  await clientRef.set(
    {
      logoURL,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  await logClientActivity({
    clientId: id,
    action: "client_updated",
    createdByUserId: actor.uid,
    message: "Logo actualizado",
    metadata: { objectPath },
  });

  return NextResponse.json({ ok: true, logoURL });
}
