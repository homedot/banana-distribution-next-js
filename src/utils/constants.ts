import type { PaymentMethod, QualityCategory } from "@/src/types";

// Kaya types (kola categories) now live in the database — see the Kola
// Categories screen and backend/services/kayaType.service.ts.

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

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/distributions", label: "Sales", icon: "truck" },
  { href: "/vendors", label: "Customers", icon: "store" },
  { href: "/payments", label: "Payments", icon: "wallet" },
  { href: "/kola-categories", label: "Kola Categories", icon: "banana" },
  // Hidden from navigation for now — pages remain reachable directly.
  // { href: "/brokers", label: "Brokers", icon: "package" },
  // { href: "/reports", label: "Reports", icon: "chart" },
] as const;
