import type { NextRequest } from "next/server";
import * as brokerService from "@/backend/services/broker.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listBrokers = asyncHandler(async () => {
  const brokers = await brokerService.listBrokers();
  return success(brokers);
});

export const createBroker = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const broker = await brokerService.createBroker(body);
  return success(broker, 201);
});

export const getBroker = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const broker = await brokerService.getBrokerById(id);
  return success(broker);
});

export const updateBroker = asyncHandler<IdParams>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const broker = await brokerService.updateBroker(id, body);
  return success(broker);
});

export const deleteBroker = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  await brokerService.deleteBroker(id);
  return success({ id });
});
