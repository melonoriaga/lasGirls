import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";
import { logAdminActivity } from "@/lib/activity/log";

export async function POST(request: Request) {
  try {
    const { idToken, remember } = (await request.json()) as { idToken?: string; remember?: boolean };
    if (!idToken) return NextResponse.json({ ok: false }, { status: 400 });

    const MIN_SESSION_MS = 1000 * 60 * 5;
    const MAX_SESSION_MS = 1000 * 60 * 60 * 24 * 14;
    const requested = remember ? MAX_SESSION_MS : 1000 * 60 * 60 * 24;
    const expiresIn = Math.min(Math.max(requested, MIN_SESSION_MS), MAX_SESSION_MS);
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
    const decoded = await adminAuth.verifyIdToken(idToken);
    const maxAgeSeconds = Math.floor(expiresIn / 1000);
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE_NAME, sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: maxAgeSeconds,
      path: "/",
    });
    await logAdminActivity({
      request,
      action: "login",
      targetType: "user",
      targetId: decoded.uid,
      fallbackActor: { uid: decoded.uid, email: decoded.email ?? "" },
      metadata: { remember: Boolean(remember) },
    });
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "No se pudo crear la sesion de admin.";
    return NextResponse.json(
      {
        ok: false,
        error: process.env.NODE_ENV === "development" ? message : "No se pudo crear la sesion de admin.",
      },
      { status: 401 },
    );
  }
}

export async function DELETE(request: Request) {
  await logAdminActivity({
    request,
    action: "logout",
    targetType: "user",
  });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
  return response;
}
