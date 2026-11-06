import type { NextRequest } from "next/server";
import * as distributionService from "@/backend/services/distribution.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listDistributions = asyncHandler(async () => {
  const distributions = await distributionService.listDistributions();
  return success(distributions);
});

export const createDistribution = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const distribution = await distributionService.createDistribution(body);
  return success(distribution, 201);
});

export const getDistribution = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const distribution = await distributionService.getDistributionById(id);
  return success(distribution);
});

export const updateDistribution = asyncHandler<IdParams>(async (request, { params }) => {
  const { id } = await params;
  const body = await request.json();
  const distribution = await distributionService.updateDistribution(id, body);
  return success(distribution);
});

export const deleteDistribution = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  await distributionService.deleteDistribution(id);
  return success({ id });
});
