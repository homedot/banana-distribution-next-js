import type { BrokerBatch, Sale, PaymentStatus, RateBasis } from "@/src/types";

export function calcGrossTotal(
  rateBasis: RateBasis,
  rate: number,
  totalWeight: number,
  kolaQuantity: number,
): number {
  const quantity = rateBasis === "per_kg" ? totalWeight : kolaQuantity;
  const gross = (rate || 0) * (quantity || 0);
  return Number.isFinite(gross) ? Math.round(gross * 100) / 100 : 0;
}

export function calcNetPayable(grossTotal: number, discount: number): number {
  const net = (grossTotal || 0) - (discount || 0);
  return Math.max(0, Math.round(net * 100) / 100);
}

export function calcBalanceDue(
  netPayable: number,
  amountCollected: number,
): number {
  const balance = (netPayable || 0) - (amountCollected || 0);
  return Math.max(0, Math.round(balance * 100) / 100);
}

export function paymentStatus(sale: Sale): PaymentStatus {
  if (sale.balanceDue <= 0) return "paid";
  if (sale.amountCollected > 0) return "partial";
  return "pending";
}

export function batchDispatchedKolas(batchId: string, sales: Sale[]): number {
  return sales.filter((d) => d.batchId === batchId).reduce(
    (sum, d) => sum + d.kolaQuantity,
    0,
  );
}

export function batchRemainingKolas(batch: BrokerBatch, sales: Sale[]): number {
  return Math.max(
    0,
    batch.inwardQtyKolas - batchDispatchedKolas(batch.id, sales),
  );
}
