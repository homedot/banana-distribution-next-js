import type { NextRequest } from "next/server";
import * as kayaTypeService from "@/backend/services/kayaType.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listKayaTypes = asyncHandler(async () => {
  const kayaTypes = await kayaTypeService.listKayaTypes();
  return success(kayaTypes);
});

export const createKayaType = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const kayaType = await kayaTypeService.createKayaType(body);
  return success(kayaType, 201);
});

export const deleteKayaType = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  await kayaTypeService.deleteKayaType(id);
  return success({ id });
});
