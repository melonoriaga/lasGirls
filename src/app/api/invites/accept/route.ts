import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { token?: string; fullName?: string; idToken?: string };
    if (!body.token || !body.idToken || !body.fullName) {
      return NextResponse.json({ ok: false, error: "Payload inválido." }, { status: 400 });
    }

    const decoded = await adminAuth.verifyIdToken(body.idToken);
    const invitationSnapshot = await adminDb
      .collection("invitations")
      .where("token", "==", body.token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (invitationSnapshot.empty) {
      return NextResponse.json({ ok: false, error: "Invitación inválida o expirada." }, { status: 404 });
    }

    const inviteDoc = invitationSnapshot.docs[0];
    const invite = inviteDoc.data();
    const expiresAtMs = new Date(String(invite.expiresAt ?? "")).getTime();
    if (Number.isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
      await inviteDoc.ref.set(
        {
          status: "expired",
          expiredAt: new Date().toISOString(),
        },
        { merge: true },
      );
      return NextResponse.json({ ok: false, error: "Invitación expirada." }, { status: 410 });
    }

    if (invite.email !== decoded.email) {
      return NextResponse.json({ ok: false, error: "El email no coincide con la invitación." }, { status: 403 });
    }

    const baseUsername = (decoded.email ?? "")
      .split("@")[0]
      .toLowerCase()
      .replace(/[^a-z0-9._-]/g, "")
      .slice(0, 30);

    await adminDb.collection("users").doc(decoded.uid).set({
      uid: decoded.uid,
      email: decoded.email,
      fullName: body.fullName,
      username: baseUsername || `user-${decoded.uid.slice(0, 6)}`,
      photoURL: "",
      contactPhone: "",
      workingHours: "",
      usefulLinks: "",
      internalNotes: "",
      role: invite.role,
      permissions: invite.permissions,
      invitedBy: invite.invitedBy,
      createdAt: new Date().toISOString(),
      isActive: true,
      lastLoginAt: new Date().toISOString(),
    });

    await inviteDoc.ref.update({
      status: "accepted",
      acceptedAt: new Date().toISOString(),
      acceptedBy: decoded.uid,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
