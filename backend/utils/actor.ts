import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, roleOf, verifyAuthToken, type UserRole } from "@/backend/utils/jwt";
import { ApiError } from "@/backend/utils/ApiError";

/** The signed-in user making a request. */
export interface Actor {
  id: string;
  email: string;
  role: UserRole;
}

/** The request's signed-in user. Throws 401 when there's no valid session. */
export function actorFrom(request: NextRequest): Actor {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) throw new ApiError(401, "Not authenticated");
  try {
    const payload = verifyAuthToken(token);
    return { id: payload.sub, email: payload.email, role: roleOf(payload) };
  } catch {
    throw new ApiError(401, "Session expired, please log in again");
  }
}

/** The request's signed-in user, who must be an admin (403 otherwise). */
export function requireAdmin(request: NextRequest): Actor {
  const actor = actorFrom(request);
  if (actor.role !== "admin") throw new ApiError(403, "Only admins can do this");
  return actor;
}
