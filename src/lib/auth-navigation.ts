/**
 * Navigation across the signed-in / signed-out boundary.
 *
 * These use full page loads on purpose, not `router.push`. With Cache
 * Components on, Next.js keeps visited pages alive (hidden with React
 * <Activity>) and the dashboard's data stays in memory. A full load is the
 * one sure way to drop all of that on logout, and to start the dashboard
 * fresh for whoever signs in next.
 */

/** Only same-site paths are allowed as a post-login destination (no open redirects). */
export function safeNextPath(raw: string | null | undefined): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return "/";
  if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/api")) return "/";
  return raw;
}

/** /login, remembering where to come back to. */
export function loginUrl(next?: string): string {
  const path = safeNextPath(next);
  return path === "/" ? "/login" : `/login?next=${encodeURIComponent(path)}`;
}

/** Leave for the login page, replacing history so Back can't return to signed-in pages. */
export function goToLogin(next?: string) {
  window.location.replace(loginUrl(next));
}

/** After signing in: open where the user was headed (from ?next=), or the dashboard. */
export function goAfterLogin() {
  const next = new URLSearchParams(window.location.search).get("next");
  window.location.replace(safeNextPath(next));
}

/** Current path + query, for use as a `next` value. */
export function currentPath(): string {
  return window.location.pathname + window.location.search;
}

/** Parse a JSON response body without throwing on HTML error pages or empty bodies. */
export async function readJson(res: Response): Promise<Record<string, unknown> | null> {
  try {
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}
