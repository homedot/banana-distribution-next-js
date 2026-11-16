import type { PaymentMethod, QualityCategory } from "@/src/types";

export const KAYA_TYPES = [
  "ഏത്തൻ", // Ethan (Nendran)
  "ഞാലി", // Njali
  "റോബസ്റ്റ", // Robusta
  "ചെറുകായ", // Cherukaya
  "പൂവൻ", // Poovan
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

export const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: "grid" },
  { href: "/distributions", label: "Sales", icon: "truck" },
  { href: "/vendors", label: "Vendors", icon: "store" },
  { href: "/payments", label: "Payment Entry", icon: "wallet" },
  // Hidden from navigation for now — pages remain reachable directly.
  // { href: "/brokers", label: "Brokers", icon: "package" },
  // { href: "/reports", label: "Reports", icon: "chart" },
] as const;
