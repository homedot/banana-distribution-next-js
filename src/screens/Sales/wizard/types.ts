import type {
  CustomField,
  PaymentDetails,
  Sale,
  PaymentMethod,
  QualityCategory,
  RateBasis,
} from "@/src/types";

export interface WizardState {
  vendorId: string;
  batchId: string;
  kayaTypes: string[];
  qualityCategory: QualityCategory;
  kolaQuantity: string;
  totalWeight: string;
  thanduCount: string;
  rateBasis: RateBasis;
  dailySellingRate: string;
  discount: string;
  amountCollected: string;
  paymentMethod: PaymentMethod;
  paymentDetails: PaymentDetails;
  notes: string;
  date: string;
  customFields: CustomField[];
}

export const emptyPaymentDetails: PaymentDetails = {
  upiId: "",
  upiTransactionId: "",
  bankName: "",
  accountHolderName: "",
  accountNumber: "",
  ifscCode: "",
  bankReference: "",
};

export const UPI_ID_PATTERN = /^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/;
export const IFSC_PATTERN = /^[A-Z]{4}0[A-Z0-9]{6}$/;
export const ACCOUNT_NUMBER_PATTERN = /^\d{9,18}$/;

/** Keeps only the fields that belong to the chosen method, trimmed; the rest are cleared. */
export function paymentDetailsForMethod(method: PaymentMethod, d: PaymentDetails): PaymentDetails {
  const t = (v: string) => v.trim();
  if (method === "upi") {
    return { ...emptyPaymentDetails, upiId: t(d.upiId), upiTransactionId: t(d.upiTransactionId) };
  }
  if (method === "bank_transfer") {
    return {
      ...emptyPaymentDetails,
      bankName: t(d.bankName),
      accountHolderName: t(d.accountHolderName),
      accountNumber: t(d.accountNumber).replace(/\s+/g, ""),
      ifscCode: t(d.ifscCode).toUpperCase(),
      bankReference: t(d.bankReference),
    };
  }
  return { ...emptyPaymentDetails };
}

export const emptyWizardState: WizardState = {
  vendorId: "",
  batchId: "",
  kayaTypes: [],
  qualityCategory: "Grade A",
  kolaQuantity: "",
  totalWeight: "",
  thanduCount: "",
  rateBasis: "per_kola",
  dailySellingRate: "",
  discount: "",
  amountCollected: "",
  paymentMethod: "cash",
  paymentDetails: emptyPaymentDetails,
  notes: "",
  date: "",
  customFields: [],
};

export function wizardStateFromSale(d: Sale): WizardState {
  return {
    vendorId: d.vendorId,
    batchId: d.batchId ?? "", // kept so editing an older sale keeps its batch link
    kayaTypes: d.kayaTypes?.length ? d.kayaTypes : d.kayaType ? [d.kayaType] : [],
    qualityCategory: d.qualityCategory,
    kolaQuantity: String(d.kolaQuantity),
    totalWeight: String(d.totalWeight),
    thanduCount: String(d.thanduCount),
    rateBasis: d.rateBasis,
    dailySellingRate: String(d.dailySellingRate),
    discount: String(d.discount || ""),
    amountCollected: String(d.amountCollected || ""),
    paymentMethod: d.paymentMethod,
    paymentDetails: { ...emptyPaymentDetails, ...d.paymentDetails },
    notes: d.notes,
    date: d.date.slice(0, 10),
    customFields: d.customFields,
  };
}
