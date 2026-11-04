"use client";

import { useId, useState } from "react";
import { Colors } from "@/src/utils/colors";

export interface DonutDatum {
  label: string;
  value: number;
  color?: string;
}

export function DonutChart({
  data,
  size = 160,
  thickness = 22,
}: {
  data: DonutDatum[];
  size?: number;
  thickness?: number;
}) {
  const id = useId();
  const [hovered, setHovered] = useState<number | null>(null);
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circumference = 2 * Math.PI * radius;

  const segments: { dash: number; offset: number; color: string }[] = [];
  for (let cumulative = 0, i = 0; i < data.length; i += 1) {
    const d = data[i];
    const dash = (d.value / total) * circumference;
    segments.push({
      dash,
      offset: circumference * 0.25 - cumulative,
      color: d.color ?? Colors.chart[i % Colors.chart.length],
    });
    cumulative += dash;
  }

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={Colors.sand[100]}
            strokeWidth={thickness}
          />
          {data.map((d, i) => {
            const { dash, offset, color } = segments[i];
            const isHovered = hovered === i;
            return (
              <circle
                key={`${id}-${d.label}`}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? thickness + 4 : thickness}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={offset}
                strokeLinecap="butt"
                className="transition-all duration-300"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-extrabold text-sand-900">
            {hovered !== null ? data[hovered].value : total}
          </span>
          <span className="text-[10px] font-medium text-sand-400">
            {hovered !== null ? data[hovered].label : "Total Kolas"}
          </span>
        </div>
      </div>

      <ul className="flex flex-1 flex-col gap-2 text-[13px]">
        {data.map((d, i) => (
          <li
            key={d.label}
            className="flex items-center justify-between gap-3 rounded-lg px-1.5 py-1 transition hover:bg-sand-50"
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="flex items-center gap-2 font-medium text-sand-700">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{
                  backgroundColor: d.color ?? Colors.chart[i % Colors.chart.length],
                }}
              />
              {d.label}
            </span>
            <span className="font-bold text-sand-900">
              {Math.round((d.value / total) * 100)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
