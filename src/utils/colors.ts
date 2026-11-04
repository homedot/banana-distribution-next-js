/**
 * Central color palette. Mirrors the Tailwind tokens defined in
 * app/globals.css (@theme) so non-Tailwind contexts (inline SVG charts,
 * canvas, etc.) can reference the exact same hex values.
 */
export const Colors = {
  banana: {
    50: "#FFFBEB",
    100: "#FEF3C7",
    200: "#FDE68A",
    300: "#FCD34D",
    400: "#FBBF24",
    500: "#F5A623",
    600: "#D98C0F",
    700: "#B06F0A",
    800: "#8A5608",
    900: "#6B4206",
  },
  forest: {
    50: "#EEF6F0",
    100: "#D5EADB",
    200: "#AED8B9",
    300: "#7FC091",
    400: "#4FA06C",
    500: "#2F7D4F",
    600: "#1F6B41",
    700: "#1A5636",
    800: "#163F28",
    900: "#0F2A1B",
  },
  sand: {
    50: "#FBF9F4",
    100: "#F4EFE5",
    200: "#E8E0D0",
    300: "#D6CBB5",
    400: "#B3A68C",
    500: "#8C7F66",
    600: "#6B6153",
    700: "#4F473B",
    800: "#332E27",
    900: "#201C17",
  },
  success: { text: "#15803D", bg: "#DCFCE7", ring: "#86EFAC" },
  warning: { text: "#B45309", bg: "#FEF3C7", ring: "#FCD34D" },
  danger: { text: "#B91C1C", bg: "#FEE2E2", ring: "#FCA5A5" },
  info: { text: "#1D4ED8", bg: "#DBEAFE", ring: "#93C5FD" },

  chart: ["#F5A623", "#1F6B41", "#2B7FD9", "#C94321", "#8A5608", "#4FA06C"],
} as const;
