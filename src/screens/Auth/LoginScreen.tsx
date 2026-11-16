"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@/src/components/icons";
import { Input } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { BrandLogo } from "@/src/components/brand/BrandLogo";

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();

      if (!res.ok || !body.success) {
        throw new Error(body.message ?? "Invalid email or password");
      }

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
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
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
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
