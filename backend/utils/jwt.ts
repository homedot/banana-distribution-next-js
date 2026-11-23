import jwt from "jsonwebtoken";

export const AUTH_COOKIE_NAME = "auth_token";
export const AUTH_TOKEN_TTL = "7d"; // one week, per product requirement
export const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export type UserRole = "admin" | "accountant";

export interface AuthTokenPayload {
  sub: string;
  email: string;
  /** Missing on tokens issued before roles existed — those were all admins. */
  role?: UserRole;
}

/** A token's role, treating pre-role tokens as admin. */
export function roleOf(payload: AuthTokenPayload): UserRole {
  return payload.role === "accountant" ? "accountant" : "admin";
}

/** Where a role lands after login, and where it's sent from pages it can't open. */
export function homePathFor(role: UserRole): string {
  return role === "accountant" ? "/distributions" : "/";
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
