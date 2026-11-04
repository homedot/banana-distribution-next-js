/**
 * Shared layout constants used outside of Tailwind class strings
 * (e.g. inline SVG dimensions, JS-driven layout math).
 */
export const Sizes = {
  sidebarWidth: 272,
  sidebarCollapsedWidth: 84,
  topbarHeight: 72,
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    pill: 999,
  },
  chart: {
    barHeight: 220,
    barGap: 18,
  },
  breakpoint: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const;
