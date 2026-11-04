import type { PaymentMethod, QualityCategory } from "@/src/types";

export const KAYA_TYPES = [
  "Nendran",
  "Robusta",
  "Poovan",
  "Rasakadali",
  "Red Banana",
  "Elakki",
] as const;

export const QUALITY_CATEGORIES: QualityCategory[] = [
  "Grade A",
  "Grade B",
  "Mixed",
];

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Cash" },
  { value: "upi", label: "UPI" },
  { value: "bank_transfer", label: "Bank Transfer" },
];

export const SERVICE_AREAS = ["Ernakulam", "Thrissur"] as const;

export const STORAGE_KEY = "banana-distribution-data-v1";

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/distributions", label: "Distributions", icon: "truck" },
  // Hidden from navigation for now — pages remain reachable directly.
  // { href: "/brokers", label: "Brokers", icon: "package" },
  // { href: "/vendors", label: "Vendors", icon: "store" },
  // { href: "/reports", label: "Reports", icon: "chart" },
] as const;
