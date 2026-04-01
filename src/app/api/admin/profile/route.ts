import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
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

export async function GET() {
  const actor = await getActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const userDoc = await adminDb.collection("users").doc(actor.uid).get();
  if (!userDoc.exists) return NextResponse.json({ ok: false, error: "Usuario no encontrado." }, { status: 404 });

  return NextResponse.json({ ok: true, profile: userDoc.data() });
}

export async function PATCH(request: Request) {
  const actor = await getActor();
  if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

  const body = (await request.json()) as {
    fullName?: string;
    username?: string;
    photoURL?: string;
    contactPhone?: string;
    workingHours?: string;
    usefulLinks?: string;
    internalNotes?: string;
  };
  const updates: Record<string, unknown> = { updatedAt: new Date().toISOString() };
  if (typeof body.fullName === "string" && body.fullName.trim().length > 1) updates.fullName = body.fullName.trim();
  if (typeof body.username === "string") {
    const normalized = body.username.trim().toLowerCase();
    if (normalized && !/^[a-z0-9._-]{3,30}$/.test(normalized)) {
      return NextResponse.json(
        { ok: false, error: "El username debe tener 3-30 caracteres válidos (a-z, 0-9, . _ -)." },
        { status: 400 },
      );
    }
    updates.username = normalized;
  }
  if (typeof body.photoURL === "string") updates.photoURL = body.photoURL;
  if (typeof body.contactPhone === "string") updates.contactPhone = body.contactPhone.trim();
  if (typeof body.workingHours === "string") updates.workingHours = body.workingHours.trim();
  if (typeof body.usefulLinks === "string") updates.usefulLinks = body.usefulLinks.trim();
  if (typeof body.internalNotes === "string") updates.internalNotes = body.internalNotes.trim();

  await adminDb.collection("users").doc(actor.uid).set(updates, { merge: true });
  await logAdminActivity({
    request,
    action: "profile_updated",
    targetType: "user",
    targetId: actor.uid,
    fallbackActor: { uid: actor.uid, email: actor.email ?? "" },
    metadata: { updatedFields: Object.keys(updates) },
  });
  return NextResponse.json({ ok: true });
}
