import { connectDB } from "@/backend/config/db";
import { Vendor } from "@/backend/models/Vendor";
import { ApiError } from "@/backend/utils/ApiError";

export interface VendorInput {
  name: string;
  contactPerson?: string;
  phone?: string;
  location: string;
}

export async function listVendors() {
  await connectDB();
  return Vendor.find().sort({ createdAt: -1 });
}

export async function createVendor(input: VendorInput) {
  await connectDB();
  return Vendor.create(input);
}

export async function getVendorById(id: string) {
  await connectDB();
  const vendor = await Vendor.findById(id);
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
}

export async function updateVendor(id: string, input: Partial<VendorInput>) {
  await connectDB();
  const vendor = await Vendor.findByIdAndUpdate(id, input, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
}

export async function deleteVendor(id: string) {
  await connectDB();
  const vendor = await Vendor.findByIdAndDelete(id);
  if (!vendor) throw new ApiError(404, "Vendor not found");
  return vendor;
}
