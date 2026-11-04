import type {
  CustomField,
  Distribution,
  PaymentMethod,
  QualityCategory,
  RateBasis,
} from "@/src/types";

export interface WizardState {
  vendorId: string;
  batchId: string;
  kayaType: string;
  qualityCategory: QualityCategory;
  kolaQuantity: string;
  totalWeight: string;
  thanduCount: string;
  rateBasis: RateBasis;
  dailySellingRate: string;
  discount: string;
  amountCollected: string;
  paymentMethod: PaymentMethod;
  notes: string;
  date: string;
  customFields: CustomField[];
}

export const emptyWizardState: WizardState = {
  vendorId: "",
  batchId: "",
  kayaType: "",
  qualityCategory: "Grade A",
  kolaQuantity: "",
  totalWeight: "",
  thanduCount: "",
  rateBasis: "per_kola",
  dailySellingRate: "",
  discount: "",
  amountCollected: "",
  paymentMethod: "cash",
  notes: "",
  date: "",
  customFields: [],
};

export function wizardStateFromDistribution(d: Distribution): WizardState {
  return {
    vendorId: d.vendorId,
    batchId: d.batchId,
    kayaType: d.kayaType,
    qualityCategory: d.qualityCategory,
    kolaQuantity: String(d.kolaQuantity),
    totalWeight: String(d.totalWeight),
    thanduCount: String(d.thanduCount),
    rateBasis: d.rateBasis,
    dailySellingRate: String(d.dailySellingRate),
    discount: String(d.discount || ""),
    amountCollected: String(d.amountCollected || ""),
    paymentMethod: d.paymentMethod,
    notes: d.notes,
    date: d.date.slice(0, 10),
    customFields: d.customFields,
  };
}

export const WIZARD_STEPS = [
  { key: "vendor", label: "Vendor & Stock" },
  { key: "quantity", label: "Quantity & Quality" },
  { key: "pricing", label: "Pricing" },
  { key: "payment", label: "Payment & Extras" },
  { key: "review", label: "Review & Save" },
] as const;

export type WizardStepKey = (typeof WIZARD_STEPS)[number]["key"];
