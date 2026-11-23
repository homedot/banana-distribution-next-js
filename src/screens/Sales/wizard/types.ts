import { calcNetPayable } from "@/src/utils/calculations";
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
  /** Kola quantity typed for each selected kaya type, keyed by kaya type. */
  kayaQuantities: Record<string, string>;
  /** Quality category chosen for each selected kaya type, keyed by kaya type. */
  kayaQualities: Record<string, QualityCategory>;
  /** Weight in kg for each selected kaya type, keyed by kaya type. */
  kayaWeights: Record<string, string>;
  /** Selling rate for each selected kaya type (per kola or per kg), keyed by kaya type. */
  kayaRates: Record<string, string>;
  /** Legacy stem count — kept so editing an older sale doesn't drop it. Not shown in the form. */
  thanduCount: string;
  /** Thandu (stem) weight in kg, subtracted from the total kola weight. */
  thanduWeight: string;
  rateBasis: RateBasis;
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
/** UPI transaction refs (RRN) are 12 digits. */
export const UPI_TXN_ID_PATTERN = /^\d{12}$/;
/** NEFT/RTGS/IMPS UTRs: 12–22 letters and digits. */
export const BANK_REFERENCE_PATTERN = /^[A-Z0-9]{12,22}$/;
/** Names: letters (any script), spaces and . ' - */
export const PERSON_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M} .'-]*$/u;
export const BANK_NAME_PATTERN = /^[\p{L}\p{M}][\p{L}\p{M}0-9 .&'()-]*$/u;

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
      bankReference: t(d.bankReference).toUpperCase(),
    };
  }
  return { ...emptyPaymentDetails };
}

export type PaymentField =
  | "amountCollected"
  | "paymentMethod"
  | keyof PaymentDetails;

/**
 * Field-by-field problems in Payment & Extras, for the method that's
 * selected. Details are required once money has been collected; optional
 * ones are only checked when filled in. Used for the inline messages and to
 * block saving, so both always agree.
 */
export function paymentFieldErrors(state: WizardState): Partial<Record<PaymentField, string>> {
  const errors: Partial<Record<PaymentField, string>> = {};
  const raw = state.amountCollected.trim();
  const collected = Number(raw) || 0;
  const netPayable = calcNetPayable(saleTotals(state).grossTotal, Number(state.discount) || 0);

  if (!raw) errors.amountCollected = "Enter the amount collected (0 if nothing was paid)";
  else if (!/^-?\d*\.?\d*$/.test(raw) || !Number.isFinite(Number(raw)))
    errors.amountCollected = "Enter a valid amount";
  else if (collected < 0) errors.amountCollected = "Amount can't be negative";
  else if (!/^\d*(\.\d{0,2})?$/.test(raw))
    errors.amountCollected = "Use at most 2 decimal places";
  else if (collected > netPayable)
    errors.amountCollected = `Can't be more than the net payable (₹${netPayable.toLocaleString("en-IN")})`;

  if (!["cash", "upi", "bank_transfer"].includes(state.paymentMethod))
    errors.paymentMethod = "Select how the customer paid";

  const d = state.paymentDetails;
  const needed = collected > 0;

  if (state.paymentMethod === "upi") {
    const upiId = d.upiId.trim();
    const txn = d.upiTransactionId.trim();
    if (!upiId) {
      if (needed) errors.upiId = "Enter the UPI ID the payment came from";
    } else if (!UPI_ID_PATTERN.test(upiId)) {
      errors.upiId = "Enter a valid UPI ID, e.g. name@okaxis";
    }
    if (txn && !UPI_TXN_ID_PATTERN.test(txn))
      errors.upiTransactionId = "UPI transaction ID is 12 digits";
  }

  if (state.paymentMethod === "bank_transfer") {
    const bank = d.bankName.trim();
    const holder = d.accountHolderName.trim();
    const acc = d.accountNumber.replace(/\s+/g, "");
    const ifsc = d.ifscCode.trim().toUpperCase();
    const ref = d.bankReference.trim().toUpperCase();
    if (!bank) {
      if (needed) errors.bankName = "Enter the bank name for the transfer";
    } else if (bank.length < 2 || !BANK_NAME_PATTERN.test(bank)) {
      errors.bankName = "Enter a valid bank name";
    }
    if (holder && !PERSON_NAME_PATTERN.test(holder))
      errors.accountHolderName = "Use letters only (no numbers or symbols)";
    if (acc && !ACCOUNT_NUMBER_PATTERN.test(acc))
      errors.accountNumber = "Account number should be 9–18 digits";
    if (ifsc && !IFSC_PATTERN.test(ifsc))
      errors.ifscCode = "Format: 4 letters, 0, then 6 characters (e.g. SBIN0001234)";
    if (!ref) {
      if (needed) errors.bankReference = "Enter the UTR / reference number for the transfer";
    } else if (!BANK_REFERENCE_PATTERN.test(ref)) {
      errors.bankReference = "UTR should be 12–22 letters and digits";
    }
  }

  return errors;
}

export const emptyWizardState: WizardState = {
  vendorId: "",
  batchId: "",
  kayaTypes: [],
  kayaQuantities: {},
  kayaQualities: {},
  kayaWeights: {},
  kayaRates: {},
  thanduCount: "",
  thanduWeight: "",
  // rateBasis: "per_kola", // Per Kola pricing hidden — new sales default to Per Kg
  rateBasis: "per_kg",
  discount: "",
  amountCollected: "",
  paymentMethod: "cash",
  paymentDetails: emptyPaymentDetails,
  notes: "",
  date: "",
  customFields: [],
};

/** Total kolas across the selected kaya types. */
export function totalKolaQuantity(state: Pick<WizardState, "kayaTypes" | "kayaQuantities">): number {
  return state.kayaTypes.reduce((sum, k) => sum + (Number(state.kayaQuantities[k]) || 0), 0);
}

const round2 = (n: number) => (Number.isFinite(n) ? Math.round(n * 100) / 100 : 0);

export interface KayaLine {
  kayaType: string;
  kolaQuantity: number;
  /** Weight entered for this kaya type, before thandu. */
  totalWeight: number;
  /** totalWeight minus this kaya's share of the thandu weight (split by weight). */
  netWeight: number;
  sellingRate: number;
  qualityCategory: QualityCategory;
  /** sellingRate × kolas (per kola) or × net kg (per kg). */
  amount: number;
}

/**
 * One priced line per selected kaya type, plus the sale's totals.
 * Thandu weight is taken off the total kola weight; with several kaya types
 * it is split across them in proportion to their weight.
 */
export function saleTotals(state: WizardState) {
  const grossWeight = round2(
    state.kayaTypes.reduce((s, k) => s + (Number(state.kayaWeights[k]) || 0), 0),
  );
  const thanduWeight = Math.max(0, Number(state.thanduWeight) || 0);
  const weight = round2(Math.max(0, grossWeight - thanduWeight));
  const netShare = grossWeight > 0 ? weight / grossWeight : 0;

  const lines: KayaLine[] = state.kayaTypes.map((kayaType) => {
    const kolaQuantity = Number(state.kayaQuantities[kayaType]) || 0;
    const totalWeight = Number(state.kayaWeights[kayaType]) || 0;
    const netWeight = round2(totalWeight * netShare);
    const sellingRate = Number(state.kayaRates[kayaType]) || 0;
    const basisQty = state.rateBasis === "per_kg" ? netWeight : kolaQuantity;
    return {
      kayaType,
      kolaQuantity,
      totalWeight,
      netWeight,
      sellingRate,
      qualityCategory: kayaQuality(state, kayaType),
      amount: round2(sellingRate * basisQty),
    };
  });
  const kolas = lines.reduce((s, l) => s + l.kolaQuantity, 0);
  const grossTotal = round2(lines.reduce((s, l) => s + l.amount, 0));
  const basisTotal = state.rateBasis === "per_kg" ? weight : kolas;
  const averageRate = basisTotal > 0 ? round2(grossTotal / basisTotal) : 0;
  /** `weight` is the net weight (after thandu); `grossWeight` is before. */
  return { lines, kolas, grossWeight, thanduWeight, weight, grossTotal, averageRate };
}

export const DEFAULT_KAYA_QUALITY: QualityCategory = "Grade A";

export function kayaQuality(state: Pick<WizardState, "kayaQualities">, kaya: string): QualityCategory {
  return state.kayaQualities[kaya] ?? DEFAULT_KAYA_QUALITY;
}

/** The sale's overall grade: the shared grade when every kaya matches, otherwise "Mixed". */
export function overallQuality(state: Pick<WizardState, "kayaTypes" | "kayaQualities">): QualityCategory {
  const grades = new Set(state.kayaTypes.map((k) => kayaQuality(state, k)));
  return grades.size === 1 ? [...grades][0] : "Mixed";
}

function kayaQualitiesFromSale(d: Sale, kayaTypes: string[]): Record<string, QualityCategory> {
  const fromItems = new Map((d.kayaItems ?? []).map((i) => [i.kayaType, i.qualityCategory]));
  // Older sales only stored one grade for the whole sale — apply it to every kaya type.
  return Object.fromEntries(kayaTypes.map((k) => [k, fromItems.get(k) ?? d.qualityCategory]));
}

/** Per-kaya weight and rate for editing. Older sales had one weight and one rate for the whole sale. */
function kayaPricingFromSale(d: Sale, kayaTypes: string[]) {
  const items = new Map((d.kayaItems ?? []).map((i) => [i.kayaType, i]));
  const weights: Record<string, string> = {};
  const rates: Record<string, string> = {};
  for (const k of kayaTypes) {
    const item = items.get(k);
    // The old single rate applied to every kaya type, so it carries over as-is.
    rates[k] = String(item?.sellingRate ?? d.dailySellingRate);
    // The old total weight can only be attributed when there was one kaya type.
    if (item?.totalWeight !== undefined) weights[k] = String(item.totalWeight);
    else if (kayaTypes.length === 1) weights[k] = String(d.totalWeight);
  }
  return { weights, rates };
}

function kayaQuantitiesFromSale(d: Sale, kayaTypes: string[]): Record<string, string> {
  if (d.kayaItems?.length) {
    return Object.fromEntries(d.kayaItems.map((i) => [i.kayaType, String(i.kolaQuantity)]));
  }
  // Older sales only stored a total. With one kaya type it's unambiguous;
  // with several, the split is unknown and has to be entered again.
  if (kayaTypes.length === 1) return { [kayaTypes[0]]: String(d.kolaQuantity) };
  return {};
}

export function wizardStateFromSale(d: Sale): WizardState {
  const kayaTypes = d.kayaTypes?.length ? d.kayaTypes : d.kayaType ? [d.kayaType] : [];
  const pricing = kayaPricingFromSale(d, kayaTypes);
  return {
    vendorId: d.vendorId,
    batchId: d.batchId ?? "", // kept so editing an older sale keeps its batch link
    kayaTypes,
    kayaQuantities: kayaQuantitiesFromSale(d, kayaTypes),
    kayaQualities: kayaQualitiesFromSale(d, kayaTypes),
    kayaWeights: pricing.weights,
    kayaRates: pricing.rates,
    thanduCount: String(d.thanduCount ?? 0),
    thanduWeight: d.thanduWeight ? String(d.thanduWeight) : "",
    rateBasis: d.rateBasis,
    discount: String(d.discount || ""),
    amountCollected: String(d.amountCollected ?? 0),
    paymentMethod: d.paymentMethod,
    paymentDetails: { ...emptyPaymentDetails, ...d.paymentDetails },
    notes: d.notes,
    date: d.date.slice(0, 10),
    customFields: d.customFields,
  };
}
