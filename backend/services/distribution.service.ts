import { connectDB } from "@/backend/config/db";
import { Distribution } from "@/backend/models/Distribution";
import { Vendor } from "@/backend/models/Vendor";
import { Batch } from "@/backend/models/Batch";
import { ApiError } from "@/backend/utils/ApiError";

export interface DistributionInput {
  vendorId: string;
  batchId: string;
  kayaType: string;
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
  balanceDue: number;
  customFields: { id: string; label: string; value: string }[];
  notes: string;
  date: string;
}

async function assertReferencesExist(vendorId: string, batchId: string) {
  const [vendor, batch] = await Promise.all([
    Vendor.findById(vendorId),
    Batch.findById(batchId),
  ]);
  if (!vendor) throw new ApiError(400, "vendorId does not match an existing vendor");
  if (!batch) throw new ApiError(400, "batchId does not match an existing batch");
}

export async function listDistributions() {
  await connectDB();
  return Distribution.find().sort({ date: -1 });
}

export async function createDistribution(input: DistributionInput) {
  await connectDB();
  await assertReferencesExist(input.vendorId, input.batchId);
  return Distribution.create(input);
}

export async function getDistributionById(id: string) {
  await connectDB();
  const distribution = await Distribution.findById(id);
  if (!distribution) throw new ApiError(404, "Distribution not found");
  return distribution;
}

export async function updateDistribution(id: string, input: DistributionInput) {
  await connectDB();
  await assertReferencesExist(input.vendorId, input.batchId);

  const distribution = await Distribution.findByIdAndUpdate(id, input, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!distribution) throw new ApiError(404, "Distribution not found");
  return distribution;
}

export async function deleteDistribution(id: string) {
  await connectDB();
  const distribution = await Distribution.findByIdAndDelete(id);
  if (!distribution) throw new ApiError(404, "Distribution not found");
  return distribution;
}
