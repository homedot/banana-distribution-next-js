"use client";

import { useEffect, useLayoutEffect, useState, type FormEvent } from "react";
import { Icon } from "@/src/components/icons";
import { Input } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { BrandLogo } from "@/src/components/brand/BrandLogo";
import { withLoading } from "@/src/store/loading";
import { goAfterLogin, readJson } from "@/src/lib/auth-navigation";

export function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Start clean whenever this screen is shown again. Next.js may keep it alive
  // (hidden) between visits, and the browser may restore it from its
  // back/forward cache — either way, a stale "Signing in…", a stale error or
  // the last password must never reappear.
  function resetForm() {
    setSubmitting(false);
    setPassword("");
    setShowPassword(false);
    setError(null);
  }
  useLayoutEffect(() => resetForm, []);
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted) resetForm();
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      await withLoading("Signing in…", async () => {
        let res: Response;
        try {
          res = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: email.trim(), password }),
          });
        } catch {
          throw new Error("Can't reach the server. Check your connection and try again.");
        }
        const body = await readJson(res);
        if (!res.ok || !body?.success) {
          const message = typeof body?.message === "string" ? body.message : null;
          throw new Error(
            message ??
              (res.status >= 500
                ? "The server had a problem signing you in. Please try again."
                : "Invalid email or password"),
          );
        }
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setPassword("");
      setSubmitting(false);
      return;
    }

    // Signed in. A full page load (not router.push) so the dashboard starts
    // fresh for this user. "Signing in…" stays up until the page changes.
    setPassword("");
    goAfterLogin();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sand-50 px-4">
      <div className="w-full max-w-sm">
        <h1 className="sr-only">St. Mary&apos;s Banana Distribution — Sign in</h1>
        <BrandLogo className="mb-8" />

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-sand-200 bg-white p-6 shadow-soft"
        >
          <h2 className="text-[15px] font-bold text-sand-900">Sign in</h2>

          <Input
            label="Email"
            type="email"
            required
            autoFocus
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            suffix={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                title={showPassword ? "Hide password" : "Show password"}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-sand-400 transition cursor-pointer hover:bg-sand-100 hover:text-sand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-400"
              >
                {showPassword ? (
                  <Icon.EyeOff className="h-[18px] w-[18px]" />
                ) : (
                  <Icon.Eye className="h-[18px] w-[18px]" />
                )}
              </button>
            }
          />

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              <Icon.AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
