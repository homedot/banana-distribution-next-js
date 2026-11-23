import type { NextRequest } from "next/server";
import * as vendorService from "@/backend/services/vendor.service";
import { plain, recordActivity, snapshot } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listVendors = asyncHandler(async () => {
  const items = await vendorService.listVendors();
  return success(items);
});

export const createVendor = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const item = await vendorService.createVendor(body);
  await recordActivity({ actor, action: "create", entity: "customer", after: plain(item) });
  return success(item, 201);
});

export const getVendor = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const item = await vendorService.getVendorById(id);
  return success(item);
});

export const updateVendor = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const body = await request.json();
  const before = await snapshot("customer", id);
  const item = await vendorService.updateVendor(id, body);
  await recordActivity({ actor, action: "update", entity: "customer", before, after: plain(item) });
  return success(item);
});

export const deleteVendor = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const item = await vendorService.deleteVendor(id);
  await recordActivity({ actor, action: "delete", entity: "customer", before: plain(item) });
  return success({ id });
});
