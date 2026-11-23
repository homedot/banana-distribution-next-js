import type { NextRequest } from "next/server";
import * as PaymentService from "@/backend/services/payment.service";
import { plain, recordActivity, snapshot } from "@/backend/services/activity.service";
import { actorFrom } from "@/backend/utils/actor";
import { success } from "@/backend/utils/response";
import { asyncHandler } from "@/backend/utils/asyncHandler";

type IdParams = { params: Promise<{ id: string }> };

export const listPayments = asyncHandler(async () => {
  const payments = await PaymentService.listPayments();
  return success(payments);
});

export const createPayment = asyncHandler(async (request: NextRequest) => {
  const actor = actorFrom(request);
  const body = await request.json();
  const result = await PaymentService.createPayment(body);
  await recordActivity({ actor, action: "create", entity: "payment", after: plain(result.payment) });
  return success(result, 201);
});

export const deletePayment = asyncHandler<IdParams>(async (request, { params }) => {
  const actor = actorFrom(request);
  const { id } = await params;
  const before = await snapshot("payment", id);
  const result = await PaymentService.deletePayment(id);
  await recordActivity({ actor, action: "delete", entity: "payment", before });
  return success(result);
});
