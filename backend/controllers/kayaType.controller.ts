import type { NextRequest } from "next/server";
import * as kayaTypeService from "@/backend/services/kayaType.service";
import { plain, recordActivity } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listKayaTypes = asyncHandler(async () => {
  const kayaTypes = await kayaTypeService.listKayaTypes();
  return success(kayaTypes);
});

export const createKayaType = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const kayaType = await kayaTypeService.createKayaType(body);
  await recordActivity({ actor, action: "create", entity: "kola_category", after: plain(kayaType) });
  return success(kayaType, 201);
});

export const deleteKayaType = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const kayaType = await kayaTypeService.deleteKayaType(id);
  await recordActivity({ actor, action: "delete", entity: "kola_category", before: plain(kayaType) });
  return success({ id });
});
