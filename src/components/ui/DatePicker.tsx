"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Icon } from "@/src/components/icons";
import { cn } from "@/src/utils/cn";
import { dateToKey, keyToDate, todayKey } from "@/src/utils/period";
import { FieldShell } from "@/src/components/ui/Field";

/**
 * App-wide date picking.
 *
 * Native <input type="date"> pickers behave differently per browser — Safari's
 * popup opens off-screen and never closes after a date is picked — so every
 * calendar in the app uses this one instead. Values are "YYYY-MM-DD" day keys
 * ("" = no date), exactly what the native input produced.
 */

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;
const WEEKDAYS = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]; // weeks run Mon → Sun
const POPOVER_WIDTH = 304;
const GAP = 6;
const EDGE = 8;

const isKey = (v: string | null | undefined): v is string => !!v && DAY_KEY.test(v);
const monthStart = (key: string) => key.slice(0, 7) + "-01";

function addMonths(key: string, n: number): string {
  const d = keyToDate(key);
  return dateToKey(new Date(d.getFullYear(), d.getMonth() + n, 1));
}

/** 6 weeks × 7 days covering the month that starts at `view`. */
function monthGrid(view: string): string[] {
  const first = keyToDate(view);
  const offset = (first.getDay() + 6) % 7;
  return Array.from({ length: 42 }, (_, i) =>
    dateToKey(new Date(first.getFullYear(), first.getMonth(), 1 - offset + i)),
  );
}

const fmt = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", opts).format(keyToDate(key));

/** "Thu, 19 Nov 2026" */
export const formatDayKey = (key: string) =>
  fmt(key, { weekday: "short", day: "numeric", month: "short", year: "numeric" });

// ── Month grid ──────────────────────────────────────────────────────────────

function Calendar({
  value,
  min,
  max,
  onSelect,
  onClear,
}: {
  value?: string;
  min?: string;
  max?: string;
  onSelect: (key: string) => void;
  onClear?: () => void;
}) {
  const today = todayKey();
  const [view, setView] = useState(() => monthStart(isKey(value) ? value : today));
  const allowed = (k: string) => (!min || k >= min) && (!max || k <= max);
  const prevDisabled = Boolean(min) && min! >= view;
  const nextDisabled = Boolean(max) && max! < addMonths(view, 1);
  const month = view.slice(0, 7);

  const navButton =
    "flex h-9 w-9 items-center justify-center rounded-lg text-sand-700 transition cursor-pointer hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <button
          type="button"
          aria-label="Previous month"
          className={navButton}
          disabled={prevDisabled}
          onClick={() => setView(addMonths(view, -1))}
        >
          <Icon.ChevronLeft className="h-5 w-5" />
        </button>
        <p className="text-[15px] font-extrabold text-sand-900" aria-live="polite">
          {fmt(view, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          aria-label="Next month"
          className={navButton}
          disabled={nextDisabled}
          onClick={() => setView(addMonths(view, 1))}
        >
          <Icon.ChevronRight className="h-5 w-5" />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((d) => (
          <span
            key={d}
            className="flex h-7 items-center justify-center text-[11.5px] font-bold uppercase text-sand-400"
          >
            {d}
          </span>
        ))}
        {monthGrid(view).map((key) => {
          const inMonth = key.slice(0, 7) === month;
          const selected = key === value;
          const isToday = key === today;
          const enabled = allowed(key);
          return (
            <button
              key={key}
              type="button"
              disabled={!enabled}
              aria-label={formatDayKey(key)}
              aria-pressed={selected}
              data-day={key}
              onClick={() => onSelect(key)}
              className={cn(
                "flex h-9 items-center justify-center rounded-lg text-[14px] font-semibold transition cursor-pointer",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-500",
                selected
                  ? "bg-forest-700 text-white shadow-soft"
                  : isToday
                    ? "bg-banana-100 text-sand-900 hover:bg-banana-200"
                    : inMonth
                      ? "text-sand-800 hover:bg-sand-100"
                      : "text-sand-300 hover:bg-sand-50",
                !enabled && "cursor-not-allowed opacity-30 hover:bg-transparent",
              )}
            >
              {Number(key.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between border-t border-sand-100 pt-2">
        {onClear ? (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg px-3 py-1.5 text-[13.5px] font-bold text-sand-500 transition cursor-pointer hover:bg-sand-100 hover:text-red-700"
          >
            Clear
          </button>
        ) : (
          <span />
        )}
        <button
          type="button"
          disabled={!allowed(today)}
          onClick={() => onSelect(today)}
          className="rounded-lg px-3 py-1.5 text-[13.5px] font-bold text-forest-700 transition cursor-pointer hover:bg-forest-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Today
        </button>
      </div>
    </div>
  );
}

// ── Floating popover, anchored to any trigger element ───────────────────────

export function CalendarPopover({
  open,
  anchorRef,
  onClose,
  value,
  min,
  max,
  onSelect,
  onClear,
}: {
  open: boolean;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: () => void;
  value?: string;
  min?: string;
  max?: string;
  onSelect: (key: string) => void;
  onClear?: () => void;
}) {
  const popRef = useRef<HTMLDivElement>(null);

  // Rendered into <body> with fixed positioning so modals / overflow never clip
  // it; kept inside the viewport, flipping above the trigger when needed.
  useLayoutEffect(() => {
    if (!open) return;
    function place() {
      const anchor = anchorRef.current;
      const pop = popRef.current;
      if (!anchor || !pop) return;
      const r = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const w = Math.min(POPOVER_WIDTH, vw - EDGE * 2);
      const h = pop.offsetHeight;
      // Align to the trigger's left edge, or its right edge if that fits better.
      let left = r.left + w > vw - EDGE ? r.right - w : r.left;
      left = Math.min(Math.max(EDGE, left), vw - w - EDGE);
      let top = r.bottom + GAP;
      if (top + h > vh - EDGE && r.top - GAP - h >= EDGE) top = r.top - GAP - h;
      pop.style.width = `${w}px`;
      pop.style.left = `${left}px`;
      pop.style.top = `${Math.max(EDGE, top)}px`;
      pop.style.visibility = "visible";
    }
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  // Move keyboard focus into the calendar (selected day, else today).
  useEffect(() => {
    if (!open) return;
    const pop = popRef.current;
    const target =
      pop?.querySelector<HTMLButtonElement>('[aria-pressed="true"]:not(:disabled)') ??
      pop?.querySelector<HTMLButtonElement>(`[data-day="${todayKey()}"]:not(:disabled)`) ??
      pop?.querySelector<HTMLButtonElement>("[data-day]:not(:disabled)");
    target?.focus({ preventScroll: true });
  }, [open]);

  // Close on outside press or Escape.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (popRef.current?.contains(t) || anchorRef.current?.contains(t)) return;
      onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      e.stopPropagation(); // don't also close a surrounding modal
      onClose();
      anchorRef.current?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open, onClose, anchorRef]);

  if (!open) return null;

  return createPortal(
    <div
      ref={popRef}
      role="dialog"
      aria-label="Choose a date"
      className="fixed z-[60] rounded-2xl border border-sand-200 bg-white p-3 shadow-lift"
      style={{ top: 0, left: 0, width: POPOVER_WIDTH, visibility: "hidden" }}
    >
      <Calendar
        value={value}
        min={min}
        max={max}
        onClear={onClear}
        onSelect={(key) => {
          onSelect(key);
          anchorRef.current?.focus();
        }}
      />
    </div>,
    document.body,
  );
}

// ── Form field: trigger button + popover ────────────────────────────────────

export interface DateFieldProps {
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  /** Show a Clear button inside the calendar (value becomes ""). */
  clearable?: boolean;
  disabled?: boolean;
  invalid?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Replaces the default trigger styling. */
  className?: string;
}

/** Bare date control (no label) — use inside your own layout. */
export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = "Select a date",
  clearable,
  disabled,
  invalid,
  id,
  className,
  ...rest
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const hasValue = isKey(value);

  return (
    <>
      <button
        ref={trigger}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={rest["aria-label"]}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          className ??
            cn(
              "flex h-11 w-full items-center gap-2.5 rounded-xl border border-sand-200 bg-white px-3.5 text-left text-[14px] outline-none transition cursor-pointer",
              "focus:border-forest-400 focus:ring-4 focus:ring-forest-100 disabled:cursor-not-allowed disabled:bg-sand-50 disabled:text-sand-400",
              invalid && "border-red-300 focus:border-red-400 focus:ring-red-100",
              open && "border-forest-400 ring-4 ring-forest-100",
            ),
        )}
      >
        <Icon.Calendar className="h-[18px] w-[18px] shrink-0 text-banana-700" />
        <span className={cn("flex-1 truncate", hasValue ? "text-sand-900" : "text-sand-400")}>
          {hasValue ? formatDayKey(value) : placeholder}
        </span>
        <Icon.ChevronDown className="h-4 w-4 shrink-0 text-sand-400" />
      </button>
      <CalendarPopover
        open={open}
        anchorRef={trigger}
        onClose={() => setOpen(false)}
        value={hasValue ? value : undefined}
        min={min}
        max={max}
        onSelect={(key) => {
          onChange(key);
          setOpen(false);
        }}
        onClear={
          clearable
            ? () => {
                onChange("");
                setOpen(false);
              }
            : undefined
        }
      />
    </>
  );
}

/** Labelled date field — drop-in for `<Input type="date" … />`. */
export function DatePicker({
  label,
  hint,
  error,
  required,
  ...props
}: Omit<DateFieldProps, "invalid"> & {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <FieldShell label={label} hint={hint} error={error} required={required}>
      <DateField {...props} invalid={Boolean(error)} />
    </FieldShell>
  );
}
