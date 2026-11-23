import type { NextRequest } from "next/server";
import * as SaleService from "@/backend/services/sale.service";
import { plain, recordActivity, snapshot } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listSales = asyncHandler(async () => {
  const sales = await SaleService.listSales();
  return success(sales);
});

export const createSale = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const sale = await SaleService.createSale(body);
  await recordActivity({ actor, action: "create", entity: "sale", after: plain(sale) });
  return success(sale, 201);
});

export const getSale = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const sale = await SaleService.getSaleById(id);
  return success(sale);
});

export const updateSale = asyncHandler<IdParams>(
  async (request, { params }) => {
    const actor = actorFrom(request);
    const { id } = await params;
    const body = await request.json();
    const before = await snapshot("sale", id);
    const sale = await SaleService.updateSale(id, body);
    await recordActivity({ actor, action: "update", entity: "sale", before, after: plain(sale) });
    return success(sale);
  },
);

export const deleteSale = asyncHandler<IdParams>(
  async (request, { params }) => {
    const actor = actorFrom(request);
    const { id } = await params;
    const sale = await SaleService.deleteSale(id);
    await recordActivity({ actor, action: "delete", entity: "sale", before: plain(sale) });
    return success({ id });
  },
);
