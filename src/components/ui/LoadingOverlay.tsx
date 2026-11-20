"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useSyncExternalStore } from "react";
import {
  getLoadingMessage,
  getServerLoadingMessage,
  subscribeLoading,
} from "@/src/store/loading";

/**
 * Full-screen loader shown while a save / edit / update / delete is running.
 * It blocks every click underneath, so nothing can be submitted twice.
 * Mounted once in the root layout; driven by `withLoading()`.
 * Animations live in app/globals.css under "Full-screen loading overlay".
 */

/** Bananas drifting up behind the card: left %, size px, duration s, delay s. */
const PARTICLES: [number, number, number, number][] = [
  [6, 26, 7.5, 0],
  [18, 18, 9, 2.4],
  [31, 30, 8, 4.8],
  [46, 20, 10, 1.2],
  [60, 34, 7, 3.6],
  [73, 22, 9.5, 0.6],
  [85, 28, 8.5, 5.4],
  [94, 18, 10.5, 2.8],
];

/** Dots orbiting the logo: start angle, colour class. */
const ORBIT: [number, string][] = [
  [0, "bg-banana-500"],
  [120, "bg-forest-600"],
  [240, "bg-banana-300"],
];

function BananaShape({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden>
      <path
        d="M10 18c2 22 18 36 40 34 4-.4 6-3 4-5-14 2-28-8-34-28-1-4-10-6-10-1z"
        className="fill-banana-400"
      />
      <path d="M8 17c-1-3 1-5 3-4l2 3-3 2z" className="fill-forest-700" />
    </svg>
  );
}

export function LoadingOverlay() {
  const message = useSyncExternalStore(
    subscribeLoading,
    getLoadingMessage,
    getServerLoadingMessage,
  );

  if (!message) return null;

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-busy="true"
      aria-live="assertive"
      aria-label={message}
      className="loading-overlay fixed inset-0 z-[100] flex cursor-wait items-center justify-center overflow-hidden p-6"
    >
      {/* Backdrop: deep forest wash with a soft banana glow in the middle */}
      <div className="absolute inset-0 bg-forest-900/60 backdrop-blur-md" />
      <div className="loading-glow pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full" />

      {/* Floating bananas */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PARTICLES.map(([left, size, duration, delay], i) => (
          <span
            key={i}
            className="loading-particle absolute bottom-[-60px]"
            style={
              {
                left: `${left}%`,
                animationDuration: `${duration}s`,
                animationDelay: `${delay}s`,
                "--drift": `${i % 2 ? 28 : -28}px`,
              } as CSSProperties
            }
          >
            <BananaShape size={size} />
          </span>
        ))}
      </div>

      {/* Card */}
      <div className="loading-card relative flex w-full max-w-[300px] flex-col items-center overflow-hidden rounded-[28px] bg-white px-8 pb-7 pt-9 text-center shadow-lift">
        <div className="loading-card-sheen pointer-events-none absolute inset-0" aria-hidden />

        <div className="relative flex h-32 w-32 items-center justify-center">
          {/* Ripples */}
          <span className="loading-ripple absolute inset-3 rounded-full border-2 border-banana-300" />
          <span className="loading-ripple absolute inset-3 rounded-full border-2 border-forest-300 [animation-delay:0.9s]" />

          {/* Rotating gradient ring */}
          <span className="loading-ring absolute inset-0 rounded-full" />
          <span className="absolute inset-[7px] rounded-full bg-white" />

          {/* Orbiting dots */}
          {ORBIT.map(([angle, color]) => (
            <span
              key={angle}
              className="loading-orbit absolute inset-0"
              style={{ "--start": `${angle}deg` } as CSSProperties}
            >
              <span
                className={`absolute left-1/2 top-[-5px] h-3 w-3 -translate-x-1/2 rounded-full shadow-soft ${color}`}
              />
            </span>
          ))}

          {/* Logo */}
          <Image
            src="/brand/logo-icon.png"
            alt=""
            width={72}
            height={72}
            priority
            className="loading-bounce relative h-[72px] w-[72px] rounded-2xl shadow-soft"
          />
          <span className="loading-shadow absolute bottom-3 h-2 w-12 rounded-full bg-sand-900/15 blur-[2px]" />
        </div>

        <p className="loading-text mt-6 text-[19px] font-extrabold">{message}</p>
        <p className="mt-1 text-[14px] font-semibold text-sand-500">Please wait a moment</p>

        {/* Indeterminate progress bar */}
        <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-sand-100" aria-hidden>
          <div className="loading-bar h-full w-2/5 rounded-full" />
        </div>
      </div>
    </div>
  );
}
