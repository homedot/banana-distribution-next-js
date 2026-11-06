import type { NextRequest } from "next/server";
import * as batchService from "@/backend/services/batch.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listBatches = asyncHandler(async () => {
  const batches = await batchService.listBatches();
  return success(batches);
});

export const createBatch = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const batch = await batchService.createBatch(body);
  return success(batch, 201);
});

export const getBatch = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const batch = await batchService.getBatchById(id);
  return success(batch);
});

export const updateBatch = asyncHandler<IdParams>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const batch = await batchService.updateBatch(id, body);
  return success(batch);
});

export const deleteBatch = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  await batchService.deleteBatch(id);
  return success({ id });
});
