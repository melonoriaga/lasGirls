import { cookies, headers } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

/** Fallback when `cookies()` no refleja el header en algunos handlers. */
function sessionCookieFromRequestHeader(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const prefix = `${SESSION_COOKIE_NAME}=`;
  const segments = cookieHeader.split(";");
  for (const segment of segments) {
    const part = segment.trim();
    if (!part.startsWith(prefix)) continue;
    const raw = part.slice(prefix.length).trim();
    if (!raw) return null;
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }
  return null;
}

export async function getSessionActor() {
  const store = await cookies();
  let sessionCookie =
    store.get(SESSION_COOKIE_NAME)?.value ?? sessionCookieFromRequestHeader((await headers()).get("cookie"));
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
