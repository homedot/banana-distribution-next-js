"use client";

import { useCallback, useId, useMemo, useState } from "react";
import { Colors } from "@/src/utils/colors";

export interface AreaSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

const PAD = { top: 16, right: 16, bottom: 30, left: 52 };

/** Rounds a max value up to a clean axis ceiling (1, 2, 2.5, 5 × 10^n). */
function niceCeil(value: number) {
  if (value <= 0) return 1;
  const exp = Math.pow(10, Math.floor(Math.log10(value)));
  const f = value / exp;
  const nice = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10;
  return nice * exp;
}

/** Monotone cubic path — smooth without overshooting below zero. */
function smoothPath(points: [number, number][]) {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0][0]},${points[0][1]}`;
  const n = points.length;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1][0] - points[i][0]);
    m.push((points[i + 1][1] - points[i][1]) / dx[i]);
  }
  const t: number[] = [m[0]];
  for (let i = 1; i < n - 1; i++) {
    t.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  }
  t.push(m[n - 2]);
  let d = `M${points[0][0]},${points[0][1]}`;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = points[i];
    const [x1, y1] = points[i + 1];
    const h = dx[i] / 3;
    d += ` C${x0 + h},${y0 + t[i] * h} ${x1 - h},${y1 - t[i + 1] * h} ${x1},${y1}`;
  }
  return d;
}

export function AreaChart({
  labels,
  series,
  height = 240,
  valueFormatter = (v: number) => String(v),
  axisFormatter,
  loading = false,
}: {
  labels: string[];
  series: AreaSeries[];
  height?: number;
  valueFormatter?: (value: number) => string;
  axisFormatter?: (value: number) => string;
  /** Show a skeleton instead of "No data yet" while data is still loading. */
  loading?: boolean;
}) {
  const gradientId = useId().replace(/:/g, "");
  const [width, setWidth] = useState(0);
  const [hoveredRaw, setHovered] = useState<number | null>(null);

  // Callback ref: (re)attaches the observer whenever the plot container mounts —
  // e.g. after data arrives and the empty state is replaced — so width is never stuck at 0.
  const wrapRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) return;
    setWidth(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = labels.length;
  // Sanitize: non-finite values (NaN/undefined from bad records) become 0, and every
  // series is aligned to the label count so paths never contain NaN coordinates.
  const safeSeries = useMemo(
    () =>
      series.map((s) => ({
        ...s,
        values: Array.from({ length: n }, (_, i) => {
          const v = Number(s.values[i]);
          return Number.isFinite(v) ? Math.max(0, v) : 0;
        }),
      })),
    [series, n]
  );
  // Ignore a stale hover index after the data shrinks.
  const hovered = hoveredRaw !== null && hoveredRaw < n ? hoveredRaw : null;

  const yMax = useMemo(
    () => niceCeil(Math.max(0, ...safeSeries.flatMap((s) => s.values))),
    [safeSeries]
  );
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * yMax);
  const formatAxis = axisFormatter ?? valueFormatter;

  const plotW = Math.max(0, width - PAD.left - PAD.right);
  const plotH = height - PAD.top - PAD.bottom;
  const xAt = (i: number) => PAD.left + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW);
  const yAt = (v: number) => PAD.top + plotH - (v / yMax) * plotH;
  const baseY = PAD.top + plotH;

  if (loading && n === 0) {
    return (
      <div style={{ height }} className="flex animate-pulse flex-col justify-end gap-3 pb-7 pl-12">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-px w-full bg-sand-100" style={{ marginBottom: 36 }} />
        ))}
        <div className="h-16 w-full rounded-t-2xl bg-sand-100/70" />
      </div>
    );
  }

  if (n === 0) {
    return (
      <div
        style={{ height }}
        className="flex flex-col items-center justify-center gap-1 text-center"
      >
        <p className="text-sm font-semibold text-sand-500">No data yet</p>
        <p className="text-xs text-sand-400">Record a sale to see the trend here.</p>
      </div>
    );
  }

  const step = n <= 1 ? plotW : plotW / (n - 1);
  const tooltipLeft = hovered !== null ? xAt(hovered) : 0;
  const tooltipFlip = hovered !== null && tooltipLeft > width - 170;

  return (
    <div>
      {safeSeries.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-4">
          {safeSeries.map((s) => (
            <span
              key={s.key}
              className="flex items-center gap-1.5 text-[12px] font-medium text-sand-600"
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <div
        ref={wrapRef}
        className="relative"
        style={{ height }}
        onMouseLeave={() => setHovered(null)}
      >
        {width > 0 && (
          <svg
            width={width}
            height={height}
            className="overflow-visible"
            role="img"
            aria-label={safeSeries.map((s) => s.label).join(", ") + " chart"}
          >
            <defs>
              {safeSeries.map((s) => (
                <linearGradient
                  key={s.key}
                  id={`${gradientId}-${s.key}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="0%"
                    stopColor={s.color}
                    stopOpacity={safeSeries.length > 1 ? 0.18 : 0.28}
                  />
                  <stop offset="100%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>

            {/* Grid + y-axis */}
            {ticks.map((t) => (
              <g key={t}>
                <line
                  x1={PAD.left}
                  x2={PAD.left + plotW}
                  y1={yAt(t)}
                  y2={yAt(t)}
                  stroke={t === 0 ? Colors.sand[200] : Colors.sand[100]}
                  strokeDasharray={t === 0 ? undefined : "3 4"}
                />
                <text
                  x={PAD.left - 10}
                  y={yAt(t)}
                  dy="0.32em"
                  textAnchor="end"
                  className="fill-sand-400 text-[11px] font-medium"
                >
                  {formatAxis(t)}
                </text>
              </g>
            ))}

            {/* X labels */}
            {/* With many points (e.g. a 31-day month) show every Nth label so they don't overlap;
                the hover tooltip still names each point. */}
            {labels.map((l, i) => i % Math.max(1, Math.ceil(n / 8)) !== 0 ? null : (
              <text
                key={l + i}
                x={xAt(i)}
                y={height - 8}
                textAnchor="middle"
                className={
                  hovered === i
                    ? "fill-sand-800 text-[11px] font-semibold"
                    : "fill-sand-500 text-[11px] font-medium"
                }
              >
                {l}
              </text>
            ))}

            {/* Crosshair */}
            {hovered !== null && (
              <line
                x1={xAt(hovered)}
                x2={xAt(hovered)}
                y1={PAD.top}
                y2={baseY}
                stroke={Colors.sand[300]}
                strokeDasharray="4 4"
              />
            )}

            {/* Areas + lines */}
            {safeSeries.map((s) => {
              const pts = s.values.map((v, i) => [xAt(i), yAt(v)] as [number, number]);
              const line = smoothPath(pts);
              const area =
                pts.length > 1
                  ? `${line} L${pts[pts.length - 1][0]},${baseY} L${pts[0][0]},${baseY} Z`
                  : "";
              return (
                <g key={s.key}>
                  {area && <path d={area} fill={`url(#${gradientId}-${s.key})`} />}
                  {pts.length > 1 && (
                    <path
                      d={line}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                  {pts.map(([x, y], i) => (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r={hovered === i ? 5.5 : n <= 12 ? 4 : 0}
                      fill={s.color}
                      stroke="#fff"
                      strokeWidth={2}
                      className="transition-all duration-150"
                    />
                  ))}
                </g>
              );
            })}

            {/* Hit targets: one full-height column per x position */}
            {labels.map((_, i) => (
              <rect
                key={i}
                x={xAt(i) - step / 2}
                y={PAD.top}
                width={Math.max(step, 24)}
                height={plotH}
                fill="transparent"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
                onTouchStart={() => setHovered((h) => (h === i ? null : i))}
              />
            ))}
          </svg>
        )}

        {hovered !== null && (
          <div
            className="pointer-events-none absolute z-10 min-w-[140px] rounded-xl bg-forest-900 px-3 py-2 text-white shadow-lift"
            style={{
              top: PAD.top,
              left: tooltipFlip ? undefined : tooltipLeft + 12,
              right: tooltipFlip ? width - tooltipLeft + 12 : undefined,
            }}
          >
            <p className="text-[11px] font-medium text-forest-200">{labels[hovered]}</p>
            {safeSeries.map((s) => (
              <p key={s.key} className="mt-1 flex items-center justify-between gap-4 text-[12px]">
                <span className="flex items-center gap-1.5 text-forest-100">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
                <span className="font-semibold">{valueFormatter(s.values[hovered] ?? 0)}</span>
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
