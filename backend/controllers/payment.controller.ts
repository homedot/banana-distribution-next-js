import type { NextRequest } from "next/server";
import * as PaymentService from "@/backend/services/payment.service";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listPayments = asyncHandler(async () => {
  const payments = await PaymentService.listPayments();
  return success(payments);
});

export const createPayment = asyncHandler(async (request: NextRequest) => {
  const body = await request.json();
  const result = await PaymentService.createPayment(body);
  return success(result, 201);
});

export const deletePayment = asyncHandler<IdParams>(async (_request, { params }) => {
  const { id } = await params;
  const result = await PaymentService.deletePayment(id);
  return success(result);
});
