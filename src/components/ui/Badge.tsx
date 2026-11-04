import type { HTMLAttributes } from "react";
import { cn } from "@/src/utils/cn";

type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "banana" | "forest";

const toneClasses: Record<Tone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  warning: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  danger: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  info: "bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-200",
  neutral: "bg-sand-100 text-sand-700 ring-1 ring-inset ring-sand-200",
  banana: "bg-banana-100 text-banana-800 ring-1 ring-inset ring-banana-300",
  forest: "bg-forest-50 text-forest-700 ring-1 ring-inset ring-forest-200",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ className, tone = "neutral", dot, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        toneClasses[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}
