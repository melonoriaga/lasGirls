import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

type FallbackActor = {
  uid?: string;
  email?: string;
  fullName?: string;
};

type LogPayload = {
  request: Request;
  action: string;
  targetType?: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  fallbackActor?: FallbackActor;
};

const parseCookie = (raw: string | null, key: string) => {
  if (!raw) return "";
  const parts = raw.split(";").map((part) => part.trim());
  const match = parts.find((part) => part.startsWith(`${key}=`));
  return match ? decodeURIComponent(match.slice(key.length + 1)) : "";
};

const normalizeLocation = (request: Request) => {
  const city = request.headers.get("x-vercel-ip-city") ?? "";
  const region = request.headers.get("x-vercel-ip-country-region") ?? "";
  const country = request.headers.get("x-vercel-ip-country") ?? request.headers.get("cf-ipcountry") ?? "";
  const composed = [city, region, country].filter(Boolean).join(", ");
  return composed || "Unknown";
};

export async function logAdminActivity({
  request,
  action,
  targetType = "",
  targetId = "",
  metadata = {},
  fallbackActor,
}: LogPayload) {
  try {
    const cookieHeader = request.headers.get("cookie");
    const sessionCookie = parseCookie(cookieHeader, SESSION_COOKIE_NAME);

    let actorUid = fallbackActor?.uid ?? "anonymous";
    let actorEmail = fallbackActor?.email ?? "";
    let actorName = fallbackActor?.fullName ?? "";

    if (sessionCookie) {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
      actorUid = decoded.uid;
      actorEmail = decoded.email ?? actorEmail;

      const userDoc = await adminDb.collection("users").doc(decoded.uid).get();
      if (userDoc.exists) {
        const user = userDoc.data() as { fullName?: string; email?: string };
        actorName = user.fullName ?? actorName;
        actorEmail = user.email ?? actorEmail;
      }
    }

    const requestPath = (() => {
      try {
        return new URL(request.url).pathname;
      } catch {
        return "";
      }
    })();

    await adminDb.collection("activityLogs").add({
      action,
      actorUid,
      actorEmail,
      actorName,
      targetType,
      targetId,
      location: normalizeLocation(request),
      ip:
        request.headers.get("x-forwarded-for") ??
        request.headers.get("x-real-ip") ??
        request.headers.get("cf-connecting-ip") ??
        "",
      userAgent: request.headers.get("user-agent") ?? "",
      path: requestPath,
      metadata,
      createdAt: new Date().toISOString(),
    });
  } catch {
    // Logging must never block the main flow.
  }
}
