import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/** Must stay in sync with `SESSION_COOKIE_NAME` in `@/lib/auth/session`. */
const SESSION_COOKIE_NAME = "lg_admin_session";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Admin auth guard ─────────────────────────────────────────────────────
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginRoute = pathname.startsWith("/admin/login");

  if (!isAdminRoute || isLoginRoute) {
    return NextResponse.next();
  }

  const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) {
    const loginUrl = new URL("/admin/login", request.url);
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
