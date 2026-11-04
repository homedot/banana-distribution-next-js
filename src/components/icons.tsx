import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement>;

function base(props: IconProps) {
  return {
    width: 20,
    height: 20,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    ...props,
  };
}

export const Icon = {
  Grid: (p: IconProps) => (
    <svg {...base(p)}>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
    </svg>
  ),
  Truck: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M2.5 6.5h11v9h-11z" />
      <path d="M13.5 10h3.4l3.1 3v2.5h-6.5z" />
      <circle cx="7" cy="18" r="1.8" />
      <circle cx="16.5" cy="18" r="1.8" />
    </svg>
  ),
  Package: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3.5 7.2 12 3l8.5 4.2-8.5 4.2-8.5-4.2Z" />
      <path d="M3.5 7.2v9.6L12 21l8.5-4.2V7.2" />
      <path d="M12 11.4V21" />
    </svg>
  ),
  Store: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3.5 9.5 4.5 4h15l1 5.5" />
      <path d="M4 9.5v10.5h16V9.5" />
      <path d="M9.5 20v-5a2.5 2.5 0 0 1 5 0v5" />
      <path d="M3.5 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 5 0" />
    </svg>
  ),
  Chart: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 20V10" />
      <path d="M11 20V4" />
      <path d="M18 20v-7" />
      <path d="M3 20h18" />
    </svg>
  ),
  Plus: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  Search: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </svg>
  ),
  ChevronDown: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  ),
  ChevronRight: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  ),
  ChevronLeft: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  ),
  Check: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m5 13 4 4L19 7" />
    </svg>
  ),
  X: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  ),
  Clock: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  ),
  TrendingUp: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="m3 16 6-6 4 4 7-8" />
      <path d="M14 6h6v6" />
    </svg>
  ),
  Wallet: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M3.5 7.5a2 2 0 0 1 2-2h11l3 3v9.5a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2Z" />
      <path d="M16 12.5h3" />
    </svg>
  ),
  Edit: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 16v4Z" />
    </svg>
  ),
  Trash: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4.5 7h15" />
      <path d="M9.5 7V4.8h5V7" />
      <path d="M6.5 7 7.3 19.5a1.8 1.8 0 0 0 1.8 1.7h5.8a1.8 1.8 0 0 0 1.8-1.7L17.5 7" />
    </svg>
  ),
  ArrowLeft: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  ),
  ArrowRight: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  Banana: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5.5 5c-1 3.5-.5 9 2 12.5 2.3 3.2 7 4 9.8 1.6" />
      <path d="M17.3 19.1c1.6-.5 2.7-1.9 2.7-3.6" />
      <path d="M5.5 5c1.6-.8 3-.6 3.6.6" />
    </svg>
  ),
  Users: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19.5c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
      <path d="M15.5 6.5c1.4.3 2.5 1.6 2.5 3.1 0 1.4-.9 2.6-2.1 3" />
      <path d="M16.5 14.8c2 .5 3.5 2.2 3.5 4.2" />
    </svg>
  ),
  Filter: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 5h16l-6 7.5V19l-4 2v-8.5Z" />
    </svg>
  ),
  Download: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3.5v12M8 12l4 4 4-4" />
      <path d="M4.5 19.5h15" />
    </svg>
  ),
  AlertCircle: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v5" />
      <circle cx="12" cy="16" r="0.2" fill="currentColor" />
    </svg>
  ),
  Scale: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3v18M7 7h10" />
      <path d="M4 7 7 7l-3 6a3 3 0 0 0 6 0Z" />
      <path d="M14 7h3l3 6a3 3 0 0 1-6 0Z" />
    </svg>
  ),
  Sparkle: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 3.5 13.4 9 19 10.4 13.4 12 12 17.5 10.6 12 5 10.4 10.6 9Z" />
    </svg>
  ),
  Phone: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M5.5 4.5h3L10 8l-2 1.5a11 11 0 0 0 5.5 5.5L15 13l3.5 1.5v3a1.5 1.5 0 0 1-1.6 1.5A14.5 14.5 0 0 1 4 5.6a1.5 1.5 0 0 1 1.5-1.1Z" />
    </svg>
  ),
  MapPin: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z" />
      <circle cx="12" cy="9" r="2.3" />
    </svg>
  ),
  Settings: (p: IconProps) => (
    <svg {...base(p)}>
      <circle cx="12" cy="12" r="3.2" />
      <path d="M12 3.5v2M12 18.5v2M20.5 12h-2M5.5 12h-2M17.7 6.3l-1.4 1.4M7.7 16.3l-1.4 1.4M17.7 17.7l-1.4-1.4M7.7 7.7 6.3 6.3" />
    </svg>
  ),
  Menu: (p: IconProps) => (
    <svg {...base(p)}>
      <path d="M4 6.5h16M4 12h16M4 17.5h16" />
    </svg>
  ),
};
