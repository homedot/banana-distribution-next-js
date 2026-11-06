import type { NextRequest } from "next/server";
import { cookies } from "next/headers";
import * as authService from "@/backend/services/auth.service";
import {
  AUTH_COOKIE_NAME,
  AUTH_COOKIE_MAX_AGE_SECONDS,
  verifyAuthToken,
} from "@/backend/utils/jwt";
import { ApiError } from "@/backend/utils/ApiError";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

export const login = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const { token, user } = await authService.login(body);

  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: AUTH_COOKIE_MAX_AGE_SECONDS,
  });

  return success({ user });
});

export const logout = asyncHandler(async () => {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
  return success({ ok: true });
});

export const me = asyncHandler(async (request: NextRequest) => {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) throw new ApiError(401, "Not authenticated");

  try {
    const payload = verifyAuthToken(token);
    return success({ user: { id: payload.sub, email: payload.email } });
  } catch {
    throw new ApiError(401, "Session expired, please log in again");
  }
});
