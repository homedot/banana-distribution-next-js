import type { NextRequest } from "next/server";
import * as brokerService from "@/backend/services/broker.service";
import { plain, recordActivity, snapshot } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listBrokers = asyncHandler(async () => {
  const items = await brokerService.listBrokers();
  return success(items);
});

export const createBroker = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const item = await brokerService.createBroker(body);
  await recordActivity({ actor, action: "create", entity: "broker", after: plain(item) });
  return success(item, 201);
});

export const getBroker = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const item = await brokerService.getBrokerById(id);
  return success(item);
});

export const updateBroker = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const body = await request.json();
  const before = await snapshot("broker", id);
  const item = await brokerService.updateBroker(id, body);
  await recordActivity({ actor, action: "update", entity: "broker", before, after: plain(item) });
  return success(item);
});

export const deleteBroker = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const item = await brokerService.deleteBroker(id);
  await recordActivity({ actor, action: "delete", entity: "broker", before: plain(item) });
  return success({ id });
});
