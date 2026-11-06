import type { NextRequest } from "next/server";
import * as vendorService from "@/backend/services/vendor.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listVendors = asyncHandler(async () => {
  const vendors = await vendorService.listVendors();
  return success(vendors);
});

export const createVendor = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const vendor = await vendorService.createVendor(body);
  return success(vendor, 201);
});

export const getVendor = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const vendor = await vendorService.getVendorById(id);
  return success(vendor);
});

export const updateVendor = asyncHandler<IdParams>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const vendor = await vendorService.updateVendor(id, body);
  return success(vendor);
});

export const deleteVendor = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  await vendorService.deleteVendor(id);
  return success({ id });
});
