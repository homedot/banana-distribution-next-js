"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/src/components/icons";
import { cn } from "@/src/utils/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  widthClassName,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-sand-900/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-lift",
          widthClassName ?? "max-w-md"
        )}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-sand-900">{title}</h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-sand-400 transition hover:bg-sand-100 hover:text-sand-700 cursor-pointer"
          >
            <Icon.X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
