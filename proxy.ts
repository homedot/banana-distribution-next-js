import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE_NAME,
  homePathFor,
  roleOf,
  verifyAuthToken,
  type UserRole,
} from "@/backend/utils/jwt";
import { safeNextPath } from "@/src/lib/auth-navigation";

// Public pages that don't require a session.
const PUBLIC_PATHS = ["/login"];
// API routes that must stay reachable without a session (login itself,
// plus the session check the login page uses).
const PUBLIC_API_PREFIXES = ["/api/auth"];

// Pages only admins may open. Accountants are sent to their home page instead.
const ADMIN_ONLY_PATHS = ["/", "/activity"];

/** The signed-in user's role, or null when there's no valid session. */
function sessionRole(request: NextRequest): UserRole | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    return roleOf(verifyAuthToken(token));
  } catch {
    return null;
  }
}

// This is an optimistic check only — it verifies the JWT's signature and
// expiry from the cookie, not against the database. See backend/README.md.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const role = sessionRole(request);
  const authed = role !== null;

  if (pathname.startsWith("/api")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (isPublicApi || authed) return NextResponse.next();
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  if (isPublicPage) {
    if (authed) return NextResponse.redirect(new URL(safeNextPath(request.nextUrl.searchParams.get("next")), request.url));
    return NextResponse.next();
  }

  if (!authed) {
    // Remember the page they asked for, so signing in brings them back to it.
    const loginUrl = new URL("/login", request.url);
    const next = pathname + request.nextUrl.search;
    if (next !== "/") loginUrl.searchParams.set("next", next);
    return NextResponse.redirect(loginUrl);
  }

  if (role !== "admin" && ADMIN_ONLY_PATHS.includes(pathname)) {
    return NextResponse.redirect(new URL(homePathFor(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
