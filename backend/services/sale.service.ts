import { connectDB } from "@/backend/config/db";
import { Sale } from "@/backend/models/Sale";
import { Vendor } from "@/backend/models/Vendor";
import { Batch } from "@/backend/models/Batch";
import { ApiError } from "@/backend/utils/ApiError";

export interface SaleInput {
  vendorId: string;
  batchId?: string | null;
  kayaType?: string;
  kayaTypes?: string[];
  qualityCategory: "Grade A" | "Grade B" | "Mixed";
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
    throw new ApiError(400, "vendorId does not match an existing vendor");
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
  return { ...input, kayaTypes, kayaType: kayaTypes.join(", ") };
}

export async function listSales() {
  await connectDB();
  return Sale.find().sort({ date: -1 });
}

export async function createSale(input: SaleInput) {
  await connectDB();
  await assertReferencesExist(input.vendorId, input.batchId);
  return Sale.create(normalizeKaya(input));
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

  const sale = await Sale.findByIdAndUpdate(id, normalizeKaya(input), {
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
