"use client";

import { useState } from "react";
import { Colors } from "@/src/utils/colors";

export interface BarDatum {
  label: string;
  value: number;
  sublabel?: string;
}

export function BarChart({
  data,
  height = 200,
  valueFormatter = (v: number) => String(v),
  color = Colors.banana[500],
}: {
  data: BarDatum[];
  height?: number;
  valueFormatter?: (value: number) => string;
  color?: string;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return (
      <div style={{ height }} className="flex items-center justify-center text-sm text-sand-400">
        No data yet
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 sm:gap-4" style={{ height }}>
      {data.map((d, i) => {
        const pct = Math.max(3, (d.value / max) * 100);
        const isHovered = hovered === i;
        return (
          <div
            key={d.label + i}
            className="group flex h-full flex-1 flex-col items-center gap-2"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <div className="flex w-full flex-1 items-end">
              <div
                className="relative w-full rounded-t-lg transition-all duration-300"
                style={{
                  height: `${pct}%`,
                  backgroundColor: isHovered ? Colors.forest[600] : color,
                  minHeight: 4,
                }}
              >
                {isHovered && (
                  <div className="absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-forest-900 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lift">
                    {valueFormatter(d.value)}
                  </div>
                )}
              </div>
            </div>
            <span className="text-[11px] font-medium text-sand-500">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
