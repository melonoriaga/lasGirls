import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { logAdminActivity } from "@/lib/activity/log";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { createInvitation } from "@/services/invite.service";

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "editor", "viewer"]),
});

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

const getAppUrl = (request: Request) => {
  const fromEnv = process.env.APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
  const forwardedProto = request.headers.get("x-forwarded-proto")?.trim() || "https";
  if (forwardedHost && !/^(0\.0\.0\.0|127\.0\.0\.1|localhost)(:\d+)?$/i.test(forwardedHost)) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, "");
  }

  const host = request.headers.get("host")?.trim();
  if (host && !/^(0\.0\.0\.0|127\.0\.0\.1|localhost)(:\d+)?$/i.test(host)) {
    const proto = request.headers.get("x-forwarded-proto")?.trim() || "https";
    return `${proto}://${host}`.replace(/\/$/, "");
  }

  try {
    const origin = new URL(request.url).origin;
    if (!/0\.0\.0\.0|127\.0\.0\.1|localhost/i.test(origin)) return origin.replace(/\/$/, "");
  } catch {}

  return "http://localhost:3000";
};

export async function POST(request: Request) {
  try {
    const actor = await getActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    const body = await request.json();
    const parsed = inviteSchema.parse({
      email: String(body?.email ?? "").trim().toLowerCase(),
      role: body?.role,
    });

    const existingSnapshot = await adminDb.collection("invitations").get();
    const existingPending = existingSnapshot.docs.find((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return (
        String(data.email ?? "").trim().toLowerCase() === parsed.email &&
        String(data.status ?? "") === "pending"
      );
    });

    const appUrl = getAppUrl(request);
    if (existingPending) {
      const data = existingPending.data() as Record<string, unknown>;
      return NextResponse.json({
        ok: true,
        reused: true,
        invitationId: existingPending.id,
        token: String(data.token ?? ""),
        inviteUrl: `${appUrl}/invite/${String(data.token ?? "")}`,
      });
    }

    const invite = await createInvitation(parsed.email, parsed.role, actor.uid);
    await logAdminActivity({
      request,
      action: "invite_created",
      targetType: "invitation",
      targetId: invite.id,
      metadata: { email: parsed.email, role: parsed.role },
    });
    return NextResponse.json({
      ok: true,
      reused: false,
      invitationId: invite.id,
      token: invite.token,
      inviteUrl: `${appUrl}/invite/${invite.token}`,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  try {
    const actor = await getActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });
    const body = (await request.json()) as { invitationId?: string; action?: "revoke" | "delete" };
    if (!body.invitationId) {
      return NextResponse.json({ ok: false, error: "Falta invitationId." }, { status: 400 });
    }

    if (body.action === "delete") {
      await adminDb.collection("invitations").doc(body.invitationId).delete();
    } else {
      await adminDb.collection("invitations").doc(body.invitationId).set(
        {
          status: "revoked",
          revokedAt: new Date().toISOString(),
          revokedBy: actor.uid,
        },
        { merge: true },
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function GET(request: Request) {
  try {
    const actor = await getActor();
    if (!actor?.uid) return NextResponse.json({ ok: false, error: "No autorizado." }, { status: 401 });

    const appUrl = getAppUrl(request);
    const snapshot = await adminDb.collection("invitations").orderBy("createdAt", "desc").limit(100).get();
    const invitations = snapshot.docs.map((doc) => {
      const data = doc.data() as Record<string, unknown>;
      return {
        id: doc.id,
        email: String(data.email ?? ""),
        role: String(data.role ?? "viewer"),
        status: String(data.status ?? "pending"),
        createdAt: String(data.createdAt ?? ""),
        expiresAt: String(data.expiresAt ?? ""),
        acceptedAt: String(data.acceptedAt ?? ""),
        token: String(data.token ?? ""),
        inviteUrl: `${appUrl}/invite/${String(data.token ?? "")}`,
      };
    });

    return NextResponse.json({ ok: true, invitations });
  } catch (error) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}
