import type { NextRequest } from "next/server";
import * as batchService from "@/backend/services/batch.service";
import { plain, recordActivity, snapshot } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listBatches = asyncHandler(async () => {
  const items = await batchService.listBatches();
  return success(items);
});

export const createBatch = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const item = await batchService.createBatch(body);
  await recordActivity({ actor, action: "create", entity: "batch", after: plain(item) });
  return success(item, 201);
});

export const getBatch = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const item = await batchService.getBatchById(id);
  return success(item);
});

export const updateBatch = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const body = await request.json();
  const before = await snapshot("batch", id);
  const item = await batchService.updateBatch(id, body);
  await recordActivity({ actor, action: "update", entity: "batch", before, after: plain(item) });
  return success(item);
});

export const deleteBatch = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const item = await batchService.deleteBatch(id);
  await recordActivity({ actor, action: "delete", entity: "batch", before: plain(item) });
  return success({ id });
});
