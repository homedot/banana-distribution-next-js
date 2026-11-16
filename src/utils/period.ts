/**
 * Day / week / month periods for filtering by sale date.
 * Works on "YYYY-MM-DD" day keys so comparisons are plain string compares and
 * never shift across time zones.
 */

export type Period = "day" | "week" | "month" | "all";

export interface PeriodRange {
  /** Inclusive first day key, or null for "all". */
  start: string | null;
  /** Inclusive last day key, or null for "all". */
  end: string | null;
}

const pad = (n: number) => String(n).padStart(2, "0");

export function dateToKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Local-midnight Date for a day key. */
export function keyToDate(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function todayKey(): string {
  return dateToKey(new Date());
}

/** Normalises a stored date (ISO string or YYYY-MM-DD) to a YYYY-MM-DD key. */
export function toDayKey(value: string | undefined | null): string | null {
  if (!value) return null;
  // Dates are stored as UTC midnight of the chosen day, so the date part is the day.
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : dateToKey(d);
}

function addDays(key: string, days: number): string {
  const d = keyToDate(key);
  d.setDate(d.getDate() + days);
  return dateToKey(d);
}

/** Weeks run Monday → Sunday. */
function weekStart(key: string): string {
  const d = keyToDate(key);
  const offset = (d.getDay() + 6) % 7; // Mon = 0 … Sun = 6
  return addDays(key, -offset);
}

export function periodRange(period: Period, anchor: string): PeriodRange {
  switch (period) {
    case "day":
      return { start: anchor, end: anchor };
    case "week": {
      const start = weekStart(anchor);
      return { start, end: addDays(start, 6) };
    }
    case "month": {
      const d = keyToDate(anchor);
      const start = dateToKey(new Date(d.getFullYear(), d.getMonth(), 1));
      const end = dateToKey(new Date(d.getFullYear(), d.getMonth() + 1, 0));
      return { start, end };
    }
    default:
      return { start: null, end: null };
  }
}

export function inRange(dayKey: string | null, range: PeriodRange): boolean {
  if (!dayKey) return range.start === null;
  if (range.start && dayKey < range.start) return false;
  if (range.end && dayKey > range.end) return false;
  return true;
}

/** Moves the anchor one period back (-1) or forward (+1). */
export function shiftAnchor(period: Period, anchor: string, dir: -1 | 1): string {
  if (period === "day") return addDays(anchor, dir);
  if (period === "week") return addDays(anchor, 7 * dir);
  if (period === "month") {
    const d = keyToDate(anchor);
    return dateToKey(new Date(d.getFullYear(), d.getMonth() + dir, 1));
  }
  return anchor;
}

/** True when the period containing `anchor` is the current one (can't go further forward). */
export function isCurrentPeriod(period: Period, anchor: string): boolean {
  if (period === "all") return true;
  return inRange(todayKey(), periodRange(period, anchor));
}

const fmt = (key: string, opts: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat("en-IN", opts).format(keyToDate(key));

/** Human label for the selected period, e.g. "Today", "10 – 16 Nov 2026", "November 2026". */
export function periodLabel(period: Period, anchor: string): string {
  const today = todayKey();
  if (period === "all") return "All time";
  if (period === "day") {
    if (anchor === today) return "Today";
    if (anchor === addDays(today, -1)) return "Yesterday";
    return fmt(anchor, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }
  const { start, end } = periodRange(period, anchor);
  if (period === "week") {
    const sameMonth = start!.slice(0, 7) === end!.slice(0, 7);
    const left = fmt(start!, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
    return `${left} – ${fmt(end!, { day: "numeric", month: "short", year: "numeric" })}`;
  }
  return fmt(anchor, { month: "long", year: "numeric" });
}

/** Short phrase used in card subtitles, e.g. "this week", "on 12 Nov". */
export function periodPhrase(period: Period, anchor: string): string {
  const current = isCurrentPeriod(period, anchor);
  if (period === "all") return "all time";
  if (period === "day") {
    const label = periodLabel("day", anchor);
    return label === "Today" || label === "Yesterday" ? label.toLowerCase() : `on ${fmt(anchor, { day: "numeric", month: "short" })}`;
  }
  if (period === "week") return current ? "this week" : `week of ${periodLabel("week", anchor)}`;
  return current ? "this month" : `in ${periodLabel("month", anchor)}`;
}

export interface ChartBucket {
  label: string;
  start: string;
  end: string;
}

/**
 * Chart x-axis buckets for a period:
 * - day   → the 7 days ending on that day (context around the selected day)
 * - week  → each day of the week
 * - month → each day of the month
 * - all   → one bucket per month, from the first to the last month with sales
 */
export function chartBuckets(period: Period, anchor: string, allDayKeys: string[]): ChartBucket[] {
  const day = (key: string): ChartBucket => ({
    label: fmt(key, { day: "2-digit", month: "short" }),
    start: key,
    end: key,
  });
  if (period === "day") {
    return Array.from({ length: 7 }, (_, i) => day(addDays(anchor, i - 6)));
  }
  if (period === "week" || period === "month") {
    const { start, end } = periodRange(period, anchor);
    const out: ChartBucket[] = [];
    for (let k = start!; k <= end!; k = addDays(k, 1)) out.push(day(k));
    return out;
  }
  if (allDayKeys.length === 0) return [];
  const sorted = [...allDayKeys].sort();
  const out: ChartBucket[] = [];
  let k = sorted[0].slice(0, 7) + "-01";
  const last = sorted[sorted.length - 1];
  while (k <= last) {
    const r = periodRange("month", k);
    out.push({ label: fmt(k, { month: "short", year: "2-digit" }), start: r.start!, end: r.end! });
    k = shiftAnchor("month", k, 1);
  }
  return out;
}

export interface PeriodValue {
  period: Period;
  /** Day key (YYYY-MM-DD) inside the selected period; "" while on "All Time". */
  anchor: string;
}

// ── Custom From → To date ranges (Vendors screens) ─────────────────────────

const DAY_KEY = /^\d{4}-\d{2}-\d{2}$/;

export const ALL_TIME: PeriodRange = { start: null, end: null };

export function isAllTime(range: PeriodRange): boolean {
  return !range.start && !range.end;
}

/** Reads ?from=…&to=… (as written by `rangeQuery`) back into a range; anything invalid → all time. */
export function parseRangeQuery(from?: string | string[], to?: string | string[]): PeriodRange {
  const f = typeof from === "string" && DAY_KEY.test(from) ? from : null;
  const t = typeof to === "string" && DAY_KEY.test(to) ? to : null;
  if (!f || !t || f > t) return ALL_TIME;
  return { start: f, end: t };
}

/** "?from=2026-11-01&to=2026-11-16", or "" for all time — to carry the filter across pages. */
export function rangeQuery(range: PeriodRange): string {
  return range.start && range.end ? `?from=${range.start}&to=${range.end}` : "";
}

/** "1 – 16 Nov 2026", "28 Oct – 3 Nov 2026", "12 Nov 2026" (single day), "All time". */
export function rangeLabel(range: PeriodRange): string {
  const { start, end } = range;
  if (!start || !end) return "All time";
  if (start === end) return fmt(start, { day: "numeric", month: "short", year: "numeric" });
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  const sameMonth = sameYear && start.slice(0, 7) === end.slice(0, 7);
  const left = fmt(
    start,
    sameMonth ? { day: "numeric" } : sameYear ? { day: "numeric", month: "short" } : { day: "numeric", month: "short", year: "numeric" },
  );
  return `${left} – ${fmt(end, { day: "numeric", month: "short", year: "numeric" })}`;
}

/** Phrase for headings: "on 12 Nov 2026", "from 1 – 16 Nov 2026", "all time". */
export function rangePhrase(range: PeriodRange): string {
  if (isAllTime(range)) return "all time";
  return range.start === range.end ? `on ${rangeLabel(range)}` : `from ${rangeLabel(range)}`;
}
