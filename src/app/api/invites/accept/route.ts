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

    if (invite.email !== decoded.email) {
      return NextResponse.json({ ok: false, error: "El email no coincide con la invitación." }, { status: 403 });
    }

    await adminDb.collection("users").doc(decoded.uid).set({
      uid: decoded.uid,
      email: decoded.email,
      fullName: body.fullName,
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
