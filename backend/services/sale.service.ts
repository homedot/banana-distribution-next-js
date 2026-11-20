import { connectDB } from "@/backend/config/db";
import { Sale } from "@/backend/models/Sale";
import { Vendor } from "@/backend/models/Vendor";
import { Batch } from "@/backend/models/Batch";
import { ApiError } from "@/backend/utils/ApiError";

type QualityCategory = "Grade A" | "Grade B" | "Mixed";
const QUALITY_CATEGORIES: QualityCategory[] = ["Grade A", "Grade B", "Mixed"];

export interface SaleInput {
  vendorId: string;
  batchId?: string | null;
  kayaType?: string;
  kayaTypes?: string[];
  kayaItems?: {
    kayaType: string;
    kolaQuantity: number;
    qualityCategory?: QualityCategory;
    totalWeight?: number;
    sellingRate?: number;
  }[];
  qualityCategory: QualityCategory;
  kolaQuantity: number;
  totalWeight: number;
  thanduCount: number;
  rateBasis: "per_kola" | "per_kg";
  dailySellingRate: number;
  grossTotal: number;
  discount: number;
  netPayable: number;
  amountCollected: number;
  paymentMethod: "cash" | "upi" | "bank_transfer";
  paymentDetails?: {
    upiId?: string;
    upiTransactionId?: string;
    bankName?: string;
    accountHolderName?: string;
    accountNumber?: string;
    ifscCode?: string;
    bankReference?: string;
  };
  balanceDue: number;
  customFields: { id: string; label: string; value: string }[];
  notes: string;
  date: string;
}

async function assertReferencesExist(vendorId: string, batchId?: string | null) {
  const [vendor, batch] = await Promise.all([
    Vendor.findById(vendorId),
    batchId ? Batch.findById(batchId) : Promise.resolve(null),
  ]);
  if (!vendor)
    throw new ApiError(400, "Selected customer does not exist");
  if (batchId && !batch)
    throw new ApiError(400, "batchId does not match an existing batch");
}

/** Accepts `kayaTypes` (or a single legacy `kayaType`) and fills both fields consistently. */
function normalizeKaya(input: SaleInput): SaleInput {
  const source =
    Array.isArray(input.kayaTypes) && input.kayaTypes.length > 0
      ? input.kayaTypes
      : input.kayaType
        ? [input.kayaType]
        : [];
  const kayaTypes = [...new Set(source.map((k) => String(k).trim()).filter(Boolean))];
  if (kayaTypes.length === 0) throw new ApiError(400, "Select at least one kaya type");

  // Per-kaya quantities: when given, there must be one per kaya type, and
  // the sale's kolaQuantity becomes their total.
  if (!Array.isArray(input.kayaItems) || input.kayaItems.length === 0) {
    return { ...input, kayaTypes, kayaType: kayaTypes.join(", "), kayaItems: [] };
  }
  type Item = {
    kolaQuantity: number;
    qualityCategory: QualityCategory;
    totalWeight?: number;
    sellingRate?: number;
  };
  const optionalAmount = (v: unknown, what: string, kaya: string) => {
    if (v === undefined || v === null) return undefined;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) throw new ApiError(400, `Enter a valid ${what} for ${kaya}`);
    return n;
  };
  const byKaya = new Map<string, Item>();
  for (const item of input.kayaItems) {
    const kaya = String(item?.kayaType ?? "").trim();
    const qty = Number(item?.kolaQuantity);
    const quality = item?.qualityCategory ?? input.qualityCategory;
    if (!kayaTypes.includes(kaya))
      throw new ApiError(400, `Kola quantity given for an unselected kaya type: ${kaya || "(blank)"}`);
    if (!Number.isFinite(qty) || qty < 0)
      throw new ApiError(400, `Enter a valid kola quantity for ${kaya}`);
    if (!QUALITY_CATEGORIES.includes(quality))
      throw new ApiError(400, `Select a quality category for ${kaya}`);
    byKaya.set(kaya, {
      kolaQuantity: qty,
      qualityCategory: quality,
      totalWeight: optionalAmount(item?.totalWeight, "weight", kaya),
      sellingRate: optionalAmount(item?.sellingRate, "selling rate", kaya),
    });
  }
  const missing = kayaTypes.find((k) => !byKaya.has(k));
  if (missing) throw new ApiError(400, `Enter the kola quantity for ${missing}`);
  const kayaItems = kayaTypes.map((kayaType) => ({ kayaType, ...byKaya.get(kayaType)! }));
  const kolaQuantity = kayaItems.reduce((sum, i) => sum + i.kolaQuantity, 0);
  // Overall grade follows the items: their shared grade, or "Mixed" when they differ.
  const grades = new Set(kayaItems.map((i) => i.qualityCategory));
  const qualityCategory: QualityCategory = grades.size === 1 ? [...grades][0] : "Mixed";
  const normalized: SaleInput = {
    ...input,
    kayaTypes,
    kayaType: kayaTypes.join(", "),
    kayaItems,
    kolaQuantity,
    qualityCategory,
  };

  // Per-kaya weight and rate: when every item has them, the sale's weight,
  // average rate and money totals are derived from the items.
  if (kayaItems.every((i) => i.totalWeight !== undefined && i.sellingRate !== undefined)) {
    const round2 = (n: number) => Math.round(n * 100) / 100;
    const perKg = input.rateBasis === "per_kg";
    const totalWeight = round2(kayaItems.reduce((s, i) => s + i.totalWeight!, 0));
    const grossTotal = round2(
      kayaItems.reduce((s, i) => s + round2(i.sellingRate! * (perKg ? i.totalWeight! : i.kolaQuantity)), 0),
    );
    const basis = perKg ? totalWeight : kolaQuantity;
    const netPayable = Math.max(0, round2(grossTotal - (Number(input.discount) || 0)));
    Object.assign(normalized, {
      totalWeight,
      grossTotal,
      dailySellingRate: basis > 0 ? round2(grossTotal / basis) : 0,
      netPayable,
      balanceDue: Math.max(0, round2(netPayable - (Number(input.amountCollected) || 0))),
    });
  }
  return normalized;
}

/**
 * Payment rules, mirrored from the New Sale form so a bad request can't
 * slip past it: the method must be known, the amount can't exceed what's
 * payable, and once money is collected the method's key details are required.
 */
function validatePayment(input: SaleInput) {
  if (!["cash", "upi", "bank_transfer"].includes(input.paymentMethod))
    throw new ApiError(400, "Select a valid payment method");

  const collected = Number(input.amountCollected) || 0;
  if (collected < 0) throw new ApiError(400, "Amount collected can't be negative");
  if (collected > (Number(input.netPayable) || 0) + 0.005)
    throw new ApiError(400, "Amount collected can't be more than the net payable");

  const d = input.paymentDetails ?? {};
  const t = (v?: string) => (v ?? "").trim();
  if (input.paymentMethod === "upi") {
    if (collected > 0 && !t(d.upiId)) throw new ApiError(400, "Enter the UPI ID the payment came from");
    if (t(d.upiId) && !/^[a-zA-Z0-9._-]{2,256}@[a-zA-Z][a-zA-Z0-9.-]{1,63}$/.test(t(d.upiId)))
      throw new ApiError(400, "Enter a valid UPI ID, e.g. name@okaxis");
    if (t(d.upiTransactionId) && !/^\d{12}$/.test(t(d.upiTransactionId)))
      throw new ApiError(400, "UPI transaction ID is 12 digits");
  }
  if (input.paymentMethod === "bank_transfer") {
    if (collected > 0 && !t(d.bankName)) throw new ApiError(400, "Enter the bank name for the transfer");
    if (collected > 0 && !t(d.bankReference))
      throw new ApiError(400, "Enter the UTR / reference number for the transfer");
    const acc = t(d.accountNumber).replace(/\s+/g, "");
    if (acc && !/^\d{9,18}$/.test(acc)) throw new ApiError(400, "Account number should be 9–18 digits");
    if (t(d.ifscCode) && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(t(d.ifscCode).toUpperCase()))
      throw new ApiError(400, "Enter a valid IFSC code (e.g. SBIN0001234)");
    if (t(d.bankReference) && !/^[A-Z0-9]{12,22}$/.test(t(d.bankReference).toUpperCase()))
      throw new ApiError(400, "UTR should be 12–22 letters and digits");
  }
}

export async function listSales() {
  await connectDB();
  return Sale.find().sort({ date: -1 });
}

export async function createSale(input: SaleInput) {
  await connectDB();
  await assertReferencesExist(input.vendorId, input.batchId);
  const normalized = normalizeKaya(input);
  validatePayment(normalized);
  return Sale.create(normalized);
}

export async function getSaleById(id: string) {
  await connectDB();
  const sale = await Sale.findById(id);
  if (!sale) throw new ApiError(404, "Sale not found");
  return sale;
}

export async function updateSale(id: string, input: SaleInput) {
  await connectDB();
  await assertReferencesExist(input.vendorId, input.batchId);

  const normalized = normalizeKaya(input);
  validatePayment(normalized);
  const sale = await Sale.findByIdAndUpdate(id, normalized, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!sale) throw new ApiError(404, "Sale not found");
  return sale;
}

export async function deleteSale(id: string) {
  await connectDB();
  const sale = await Sale.findByIdAndDelete(id);
  if (!sale) throw new ApiError(404, "Sale not found");
  return sale;
}
