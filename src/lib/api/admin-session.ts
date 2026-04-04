import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { SESSION_COOKIE_NAME } from "@/lib/auth/session";

export async function getSessionActor() {
  const store = await cookies();
  const sessionCookie = store.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  try {
    return await adminAuth.verifySessionCookie(sessionCookie, true);
  } catch {
    return null;
  }
}
