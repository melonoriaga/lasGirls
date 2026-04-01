import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb, adminStorage } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logAdminActivity } from "@/lib/activity/log";

const getActor = async () => {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
};

export async function POST(request: Request) {
  const actor = await getActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

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
  const objectPath = `profiles/${actor.uid}/${Date.now()}-${randomUUID()}.${safeExt}`;
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
      },
    },
  });

  const encodedPath = encodeURIComponent(objectPath);
  const photoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`;

  await adminDb.collection("users").doc(actor.uid).set(
    {
      photoURL,
      updatedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  await logAdminActivity({
    request,
    action: "profile_photo_uploaded",
    targetType: "user",
    targetId: actor.uid,
    fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    metadata: { objectPath },
  });

  return NextResponse.json({ ok: true, photoURL });
}
