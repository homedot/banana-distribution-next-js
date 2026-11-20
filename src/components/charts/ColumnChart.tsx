"use client";

import { useState } from "react";

export interface ColumnSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

/** Rounds a max value up to a clean axis ceiling (1, 2, 2.5, 5 × 10^n). */
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/**
 * Simple column chart: one bar per period. With several series the bar is
 * stacked (e.g. Collected + Pending = Billed), so each bar's height is the
 * total and its colours show the split. Hover, focus or tap a bar for exact
 * numbers. Plain HTML, so it needs no measuring and works at any width.
 */
export function ColumnChart({
  labels,
  series,
  height = 220,
  valueFormatter = (v: number) => String(v),
  axisFormatter = (v: number) => String(v),
  totalLabel,
  loading = false,
  emptyText = "No sales in this period",
}: {
  labels: string[];
  series: ColumnSeries[];
  height?: number;
  valueFormatter?: (value: number) => string;
  axisFormatter?: (value: number) => string;
  /** With 2+ series, the name of the stacked total shown in the tooltip (e.g. "Billed"). */
  totalLabel?: string;
  loading?: boolean;
  emptyText?: string;
}) {
  const [active, setActive] = useState<number | null>(null);

  const totals = labels.map((_, i) => series.reduce((s, ser) => s + (ser.values[i] || 0), 0));
  const max = niceCeil(Math.max(0, ...totals));
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((f) => max * f);
  const hasData = totals.some((t) => t > 0);

  // Keep x labels readable: show at most ~8, always including the last.
  const labelEvery = Math.max(1, Math.ceil(labels.length / 8));
  const showLabel = (i: number) => i % labelEvery === 0 || i === labels.length - 1;

  if (loading) {
    return <div style={{ height }} className="animate-pulse rounded-xl bg-sand-100" />;
  }

  if (!hasData) {
    return (
      <div
        style={{ height }}
        className="flex items-center justify-center rounded-xl border border-dashed border-sand-200 text-[13px] text-sand-400"
      >
        {emptyText}
      </div>
    );
  }

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5 text-[12px] font-semibold text-sand-600">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        {/* Y axis */}
        <div className="relative w-10 shrink-0" style={{ height }}>
          {ticks.map((t, i) => (
            <span
              key={i}
              className="absolute right-0 -translate-y-1/2 text-[10.5px] font-medium text-sand-400"
              style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
            >
              {axisFormatter(t)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          {/* Plot */}
          <div className="relative" style={{ height }} onMouseLeave={() => setActive(null)}>
            {ticks.map((_, i) => (
              <div
                key={i}
                className={i === ticks.length - 1 ? "absolute inset-x-0 border-t border-sand-300" : "absolute inset-x-0 border-t border-dashed border-sand-100"}
                style={{ top: `${(i / (ticks.length - 1)) * 100}%` }}
              />
            ))}

            <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-1.5">
              {labels.map((label, i) => {
                const total = totals[i];
                const isActive = active === i;
                // Keep the tooltip inside the chart near the edges.
                const align =
                  i < labels.length / 4 ? "left-0" : i > (labels.length * 3) / 4 ? "right-0" : "left-1/2 -translate-x-1/2";
                return (
                  <button
                    key={label + i}
                    type="button"
                    aria-label={`${label}: ${series
                      .map((s) => `${s.label} ${valueFormatter(s.values[i] || 0)}`)
                      .join(", ")}`}
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    onClick={() => setActive(isActive ? null : i)}
                    className="relative flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center rounded-t-md outline-none hover:bg-sand-50 focus-visible:ring-2 focus-visible:ring-forest-300"
                  >
                    <div
                      className="flex w-full max-w-10 flex-col-reverse overflow-hidden rounded-t-md transition-opacity"
                      style={{
                        height: `${(total / max) * 100}%`,
                        minHeight: total > 0 ? 3 : 0,
                        opacity: active === null || isActive ? 1 : 0.45,
                      }}
                    >
                      {series.map((s) => {
                        const v = s.values[i] || 0;
                        if (v <= 0) return null;
                        return (
                          <div
                            key={s.key}
                            style={{ height: `${(v / total) * 100}%`, backgroundColor: s.color }}
                          />
                        );
                      })}
                    </div>

                    {isActive && (
                      <div
                        className={`pointer-events-none absolute bottom-full z-10 mb-2 min-w-36 rounded-xl bg-forest-900 px-3 py-2 text-left text-white shadow-lift ${align}`}
                      >
                        <p className="mb-1 text-[11px] font-semibold text-forest-200">{label}</p>
                        {series.map((s) => (
                          <p key={s.key} className="flex items-center justify-between gap-3 text-[12px]">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
                              {s.label}
                            </span>
                            <span className="font-bold">{valueFormatter(s.values[i] || 0)}</span>
                          </p>
                        ))}
                        {series.length > 1 && totalLabel && (
                          <p className="mt-1 flex justify-between gap-3 border-t border-white/15 pt-1 text-[12px]">
                            <span>{totalLabel}</span>
                            <span className="font-bold">{valueFormatter(total)}</span>
                          </p>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* X labels */}
          <div className="mt-2 flex gap-[3px] sm:gap-1.5">
            {labels.map((label, i) => (
              <span
                key={label + i}
                className="min-w-0 flex-1 overflow-visible whitespace-nowrap text-center text-[10.5px] font-medium text-sand-500"
              >
                {showLabel(i) ? label : ""}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
