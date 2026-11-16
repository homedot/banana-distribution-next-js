import type { ReactNode } from "react";
import { cn } from "@/src/utils/cn";

interface StatCardProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: "banana" | "forest" | "info" | "danger" | "neutral";
  trend?: string;
  trendTone?: "up" | "down" | "neutral";
  /** A money figure shown large under the label, for numbers that must be easy to read. */
  amount?: {
    label: string;
    value: string;
    /** Optional smaller line under the figure, e.g. "of ₹1,20,000 billed". */
    note?: string;
    tone?: "danger" | "success";
  };
}

const toneClasses = {
  banana: "bg-banana-50 text-banana-700",
  forest: "bg-forest-50 text-forest-700",
  info: "bg-blue-50 text-blue-700",
  danger: "bg-red-50 text-red-700",
  neutral: "bg-sand-100 text-sand-700",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  trend,
  trendTone = "neutral",
  amount,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-sand-200/80 bg-white p-5 shadow-soft transition hover:shadow-lift">
      <div className="flex items-start justify-between">
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            toneClasses[tone]
          )}
        >
          {icon}
        </div>
        {trend && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[11px] font-semibold",
              trendTone === "up" && "bg-emerald-50 text-emerald-700",
              trendTone === "down" && "bg-red-50 text-red-700",
              trendTone === "neutral" && "bg-sand-100 text-sand-600"
            )}
          >
            {trend}
          </span>
        )}
      </div>
      <p className="mt-4 text-[26px] font-extrabold leading-none tracking-tight text-sand-900">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-sand-500">{label}</p>
      {amount && (
        <div
          className={cn(
            "mt-4 rounded-xl px-4 py-3",
            amount.tone === "success" ? "bg-emerald-50" : "bg-red-50",
          )}
        >
          <p
            className={cn(
              "text-[15px] font-bold",
              amount.tone === "success" ? "text-emerald-800" : "text-red-800",
            )}
          >
            {amount.label}
          </p>
          <p
            className={cn(
              "mt-1 text-[30px] font-extrabold leading-tight tracking-tight",
              amount.tone === "success" ? "text-emerald-700" : "text-red-700",
            )}
          >
            {amount.value}
          </p>
          {amount.note && (
            <p className="mt-1 text-[14px] font-semibold text-sand-600">{amount.note}</p>
          )}
        </div>
      )}
    </div>
  );
}
