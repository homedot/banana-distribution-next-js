import type { NextRequest } from "next/server";
import * as SaleService from "@/backend/services/sale.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listSales = asyncHandler(async () => {
  const sales = await SaleService.listSales();
  return success(sales);
});

export const createSale = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const sale = await SaleService.createSale(body);
  return success(sale, 201);
});

export const getSale = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const sale = await SaleService.getSaleById(id);
  return success(sale);
});

export const updateSale = asyncHandler<IdParams>(
  async (request, { params }) => {
    const { id } = await params;
    const body = await request.json();
    const sale = await SaleService.updateSale(id, body);
    return success(sale);
  },
);

export const deleteSale = asyncHandler<IdParams>(
  async (_request, { params }) => {
    const { id } = await params;
    await SaleService.deleteSale(id);
    return success({ id });
  },
);
