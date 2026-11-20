"use client";

import { useEffect, useLayoutEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { cn } from "@/src/utils/cn";
import { withLoading } from "@/src/store/loading";
import { goToLogin } from "@/src/lib/auth-navigation";

// One /api/auth/me request per page load, shared by every caller. Login and
// logout both do a full page load, so this never outlives the session it's for.
let mePromise: Promise<string | null> | null = null;
function fetchEmail() {
  mePromise ??= fetch("/api/auth/me")
    .then((r) => (r.ok ? r.json() : null))
    .then((body) => (body?.success ? (body.data.user.email as string) : null))
    .catch(() => null);
  return mePromise;
}

/** The signed-in user's email, or null while loading / if unknown. */
export function useCurrentUserEmail() {
  const [email, setEmail] = useState<string | null>(null);
  useEffect(() => {
    let ignore = false;
    fetchEmail().then((e) => {
      if (!ignore) setEmail(e);
    });
    return () => {
      ignore = true;
    };
  }, []);
  return email;
}

/**
 * Labelled Logout button with a confirmation step, so a stray tap doesn't sign
 * staff out mid-entry. `variant="topbar"` sits on the light header;
 * `variant="sidebar"` sits on the dark green sidebar.
 */
export function LogoutButton({
  variant,
  className,
  onBeforeOpen,
}: {
  variant: "topbar" | "sidebar";
  className?: string;
  /** e.g. close the mobile sidebar drawer before showing the dialog. */
  onBeforeOpen?: () => void;
}) {
  const email = useCurrentUserEmail();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // false during the server render, true in the browser — portals need document.body.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  // If this component is hidden (kept alive by Next.js between pages) or
  // restored from the browser's back/forward cache, don't bring back an open
  // dialog or a stuck "Logging out…".
  useLayoutEffect(
    () => () => {
      setConfirming(false);
      setBusy(false);
      setError(null);
    },
    []
  );
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (!e.persisted) return;
      setConfirming(false);
      setBusy(false);
      setError(null);
    }
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  async function logout() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await withLoading("Logging out…", async () => {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) throw new Error();
      });
    } catch {
      setError("Couldn't log out. Check your connection and try again.");
      setBusy(false);
      return;
    }
    // A full page load (not router.push): it drops every kept-alive page and
    // all business data held in memory, and replaces this history entry so
    // Back can't reopen the dashboard. "Logging out…" stays until it leaves.
    mePromise = null;
    goToLogin();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          onBeforeOpen?.();
          setError(null);
          setConfirming(true);
        }}
        aria-label="Logout"
        className={cn(
          "inline-flex items-center justify-center gap-2 font-bold transition cursor-pointer outline-none focus-visible:ring-4",
          variant === "topbar"
            ? "h-11 rounded-xl border-2 border-red-200 bg-white px-3.5 text-[14px] text-red-700 hover:border-red-300 hover:bg-red-50 focus-visible:ring-red-100"
            : "h-12 w-full rounded-xl bg-white/10 px-4 text-[14.5px] text-white ring-1 ring-white/15 hover:bg-red-600 hover:ring-red-500 focus-visible:ring-red-300",
          className
        )}
      >
        <Icon.LogOut className="h-5 w-5 shrink-0" />
        <span>Logout</span>
      </button>

      {/* Portalled to <body>: the mobile sidebar uses a CSS transform, which
          would otherwise trap this full-screen dialog inside the drawer. */}
      {mounted &&
        createPortal(
          <Modal open={confirming} onClose={() => !busy && setConfirming(false)} title="Log out?">
            <div className="flex items-start gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-600">
                <Icon.LogOut className="h-6 w-6" />
              </span>
              <p className="text-[15px] leading-relaxed text-sand-700">
                {email ? (
                  <>
                    You are signed in as{" "}
                    <span className="font-bold break-all text-sand-900">{email}</span>.{" "}
                  </>
                ) : null}
                You&apos;ll need your email and password to sign in again.
              </p>
            </div>
            {error && (
              <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-[14px] font-semibold text-red-700">
                {error}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <Button
                variant="secondary"
                size="lg"
                onClick={() => setConfirming(false)}
                disabled={busy}
              >
                Stay signed in
              </Button>
              <Button
                size="lg"
                onClick={logout}
                disabled={busy}
                className="bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
              >
                <Icon.LogOut className="h-5 w-5" />
                {busy ? "Logging out…" : "Logout"}
              </Button>
            </div>
          </Modal>,
          document.body
        )}
    </>
  );
}

/** "Signed in as" chip for the top bar (hidden on small screens). */
export function SignedInChip() {
  const email = useCurrentUserEmail();
  if (!email) return null;
  return (
    <div className="hidden items-center gap-2.5 rounded-xl border border-sand-200 bg-white py-1.5 pl-1.5 pr-3 md:flex">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest-800 text-[13px] font-bold uppercase text-white">
        {email[0]}
      </span>
      <span className="leading-tight">
        <span className="block text-[11px] font-semibold text-sand-500">Signed in as</span>
        <span className="block max-w-[180px] truncate text-[13px] font-bold text-sand-900">
          {email}
        </span>
      </span>
    </div>
  );
}
