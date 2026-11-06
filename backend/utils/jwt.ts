import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_TOKEN_TTL = "7d"; // one week, per product requirement
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export interface AuthTokenPayload {
  sub: string;
  email: string;
}

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing JWT_SECRET environment variable. Add it to .env.local (see .env.example)."
    );
  }
  return secret;
}

export function signAuthToken(payload: AuthTokenPayload): string {
  return jwt.sign(payload, getSecret(), { expiresIn: AUTH_TOKEN_TTL });
}

/** Throws if the token is missing, malformed, expired, or has a bad signature. */
export function verifyAuthToken(token: string): AuthTokenPayload {
  return jwt.verify(token, getSecret()) as AuthTokenPayload;
}
