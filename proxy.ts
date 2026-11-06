import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/backend/utils/jwt";

// Public pages that don't require a session.
const PUBLIC_PATHS = ["/login"];
// API routes that must stay reachable without a session (login itself,
// plus the session check the login page uses).
const PUBLIC_API_PREFIXES = ["/api/auth"];

function isAuthenticated(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    verifyAuthToken(token);
    return true;
  } catch {
    return false;
  }
}

// This is an optimistic check only — it verifies the JWT's signature and
// expiry from the cookie, not against the database. See backend/README.md.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = isAuthenticated(request);

  if (pathname.startsWith("/api")) {
    const isPublicApi = PUBLIC_API_PREFIXES.some((p) => pathname.startsWith(p));
    if (isPublicApi || authed) return NextResponse.next();
    return NextResponse.json({ success: false, message: "Not authenticated" }, { status: 401 });
  }

  const isPublicPage = PUBLIC_PATHS.includes(pathname);

  if (isPublicPage) {
    if (authed) return NextResponse.redirect(new URL("/", request.url));
    return NextResponse.next();
  }

  if (!authed) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\..*).*)"],
};
