"use client";

import { useState } from "react";
import { Icon } from "@/src/components/icons";
import { DateField } from "@/src/components/ui/DatePicker";
import { cn } from "@/src/utils/cn";
import { isAllTime, rangeLabel, type PeriodRange } from "@/src/utils/period";

/**
 * Pick any From and To date from the calendar, then press Apply.
 * Nothing changes on screen until Apply is pressed; Clear goes back to all time.
 */
export function DateRangeFilter({
  value,
  onApply,
}: {
  value: PeriodRange;
  onApply: (range: PeriodRange) => void;
}) {
  const [from, setFrom] = useState(value.start ?? "");
  const [to, setTo] = useState(value.end ?? "");
  const [error, setError] = useState<string | null>(null);

  const active = !isAllTime(value);
  // Apply is only useful when the inputs differ from what's already applied.
  const changed = from !== (value.start ?? "") || to !== (value.end ?? "");

  function apply() {
    if (!from && !to) return clear();
    if (!from) return setError("Choose a From date");
    // Only a From date → just that one day.
    const end = to || from;
    if (end < from) return setError("To date must be on or after the From date");
    setError(null);
    setTo(end);
    onApply({ start: from, end });
  }

  function clear() {
    setFrom("");
    setTo("");
    setError(null);
    onApply({ start: null, end: null });
  }

  const dateInput = (hasError: boolean) =>
    cn(
      "flex h-14 w-full items-center gap-2.5 rounded-2xl border-2 bg-white px-4 text-left text-[18px] font-semibold text-sand-900 outline-none transition cursor-pointer",
      "focus:border-forest-600 focus:ring-4 focus:ring-forest-100",
      hasError ? "border-red-400" : "border-sand-300 hover:border-forest-400",
    );

  return (
    <div className="rounded-2xl border border-sand-200/80 bg-white p-4 shadow-soft">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-[16px] font-bold text-sand-800">
          <Icon.Calendar className="h-5 w-5 text-banana-700" />
          Filter by date
        </p>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-[14px] font-bold",
            active ? "bg-forest-700 text-white" : "bg-sand-100 text-sand-600",
          )}
          aria-live="polite"
        >
          Showing: {rangeLabel(value)}
        </span>
      </div>

      <form
        className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          apply();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold text-sand-700">From</span>
          <DateField
            aria-label="From date"
            placeholder="Start date"
            value={from}
            max={to || undefined}
            onChange={(v) => {
              setFrom(v);
              setError(null);
            }}
            className={dateInput(Boolean(error) && !from)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-[15px] font-bold text-sand-700">To</span>
          <DateField
            aria-label="To date"
            placeholder="End date"
            value={to}
            min={from || undefined}
            onChange={(v) => {
              setTo(v);
              setError(null);
            }}
            className={dateInput(Boolean(error) && Boolean(from))}
          />
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={!changed}
            className="flex h-14 flex-1 items-center justify-center gap-2 rounded-2xl bg-forest-700 px-6 text-[17px] font-bold text-white shadow-soft transition cursor-pointer hover:bg-forest-800 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
          >
            <Icon.Check className="h-5 w-5" strokeWidth={3} />
            Apply
          </button>
          {(active || from || to) && (
            <button
              type="button"
              onClick={clear}
              className="flex h-14 items-center justify-center gap-1.5 rounded-2xl border-2 border-sand-300 bg-white px-4 text-[16px] font-bold text-sand-700 transition cursor-pointer hover:border-red-300 hover:text-red-700"
            >
              <Icon.X className="h-5 w-5" />
              Clear
            </button>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-[14px] font-semibold text-red-600">
          <Icon.AlertCircle className="h-4 w-4" /> {error}
        </p>
      )}
    </div>
  );
}
