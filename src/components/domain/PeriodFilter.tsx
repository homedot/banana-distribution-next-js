"use client";

import { useRef } from "react";
import { Icon } from "@/src/components/icons";
import { cn } from "@/src/utils/cn";
import {
  isCurrentPeriod,
  periodLabel,
  shiftAnchor,
  todayKey,
  type Period,
  type PeriodValue,
} from "@/src/utils/period";

const OPTIONS: { value: Period; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
  { value: "all", label: "All Time" },
];

/**
 * Large, touch-friendly Day / Week / Month / All Time filter with ‹ › period
 * stepping and a calendar to jump straight to any date.
 */
export function PeriodFilter({
  period,
  anchor,
  onChange,
}: PeriodValue & { onChange: (next: PeriodValue) => void }) {
  const dateInput = useRef<HTMLInputElement>(null);
  const atCurrent = isCurrentPeriod(period, anchor);

  function openCalendar() {
    const input = dateInput.current;
    if (!input) return;
    input.value = anchor || todayKey();
    try {
      input.showPicker();
    } catch {
      // Older browsers: focusing the input still lets the user type a date.
      input.focus();
    }
  }

  function onPickDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
    // Picking a date from "All Time" means "show me that day".
    onChange({ period: period === "all" ? "day" : period, anchor: value });
  }

  const stepButton =
    "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-sand-300 bg-white text-sand-800 transition cursor-pointer hover:border-forest-500 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-sand-300";

  return (
    <div className="relative flex flex-col gap-3 rounded-2xl border border-sand-200/80 bg-white p-3 shadow-soft lg:flex-row lg:items-center lg:justify-between">
      <div
        role="radiogroup"
        aria-label="Show figures for"
        className="grid grid-cols-4 gap-1 rounded-xl bg-sand-100 p-1"
      >
        {OPTIONS.map((o) => {
          const active = o.value === period;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              // Switching type jumps back to the current day/week/month.
              onClick={() =>
                onChange({ period: o.value, anchor: o.value === "all" ? "" : todayKey() })
              }
              className={cn(
                "h-12 rounded-lg px-4 text-[16px] font-bold transition cursor-pointer",
                active ? "bg-forest-700 text-white shadow-soft" : "text-sand-700 hover:bg-white",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>

      {/* Native date picker, opened by the calendar buttons below. */}
      <input
        ref={dateInput}
        type="date"
        tabIndex={-1}
        aria-hidden
        className="pointer-events-none absolute bottom-0 right-3 h-0 w-0 opacity-0"
        onChange={(e) => onPickDate(e.target.value)}
      />

      {period === "all" ? (
        <button
          type="button"
          onClick={openCalendar}
          className="flex h-12 items-center justify-center gap-2 rounded-xl border-2 border-sand-300 bg-white px-4 text-[16px] font-bold text-sand-800 transition cursor-pointer hover:border-forest-500"
        >
          <Icon.Calendar className="h-5 w-5 text-banana-700" />
          Pick a date
        </button>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label={`Previous ${period}`}
            className={stepButton}
            onClick={() => onChange({ period, anchor: shiftAnchor(period, anchor, -1) })}
          >
            <Icon.ChevronLeft className="h-6 w-6" />
          </button>
          <button
            type="button"
            onClick={openCalendar}
            title="Pick a date"
            className="flex h-12 min-w-0 flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl bg-banana-50 px-4 transition hover:bg-banana-100 lg:min-w-[240px]"
          >
            <Icon.Calendar className="h-5 w-5 shrink-0 text-banana-700" />
            <span className="truncate text-[17px] font-extrabold text-sand-900" aria-live="polite">
              {periodLabel(period, anchor)}
            </span>
          </button>
          <button
            type="button"
            aria-label={`Next ${period}`}
            className={stepButton}
            disabled={atCurrent}
            onClick={() => onChange({ period, anchor: shiftAnchor(period, anchor, 1) })}
          >
            <Icon.ChevronRight className="h-6 w-6" />
          </button>
          {!atCurrent && (
            <button
              type="button"
              onClick={() => onChange({ period, anchor: todayKey() })}
              className="h-12 shrink-0 rounded-xl px-3 text-[15px] font-bold text-forest-700 transition cursor-pointer hover:bg-forest-50"
            >
              {period === "day" ? "Today" : period === "week" ? "This week" : "This month"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
