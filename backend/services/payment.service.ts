import mongoose from "mongoose";
import { connectDB } from "@/backend/config/db";
import { Payment } from "@/backend/models/Payment";
import { Sale } from "@/backend/models/Sale";
import { Vendor } from "@/backend/models/Vendor";
import { ApiError } from "@/backend/utils/ApiError";

export interface PaymentInput {
  vendorId: string;
  amount: number;
  method: "cash" | "upi" | "bank_transfer";
  date: string;
  reference?: string;
  notes?: string;
}

const METHODS = ["cash", "upi", "bank_transfer"];

/** Money is kept to 2 decimals so repeated += / -= never drifts. */
const round2 = (n: number) => Math.round(n * 100) / 100;

export async function listPayments() {
  await connectDB();
  return Payment.find().sort({ date: -1, createdAt: -1 });
}

/**
 * Records a vendor payment and applies it to that vendor's unpaid sales,
 * oldest first. The payment and every sale update commit together or not at all.
 * Returns the payment plus the sales whose balances changed.
 */
export async function createPayment(input: PaymentInput) {
  await connectDB();

  const amount = round2(Number(input.amount));
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError(400, "Amount must be greater than zero");
  }
  if (!METHODS.includes(input.method)) {
    throw new ApiError(400, "Select a valid payment method");
  }
  if (!input.date || Number.isNaN(new Date(input.date).getTime())) {
    throw new ApiError(400, "Select a valid payment date");
  }
  if (
    !mongoose.isValidObjectId(input.vendorId) ||
    !(await Vendor.exists({ _id: input.vendorId }))
  ) {
    throw new ApiError(400, "Select an existing vendor");
  }

  const session = await mongoose.startSession();
  try {
    let result!: { payment: unknown; sales: unknown[] };
    await session.withTransaction(async () => {
      const pending = await Sale.find({ vendorId: input.vendorId, balanceDue: { $gt: 0 } })
        .sort({ date: 1, createdAt: 1 })
        .session(session);

      const outstanding = round2(pending.reduce((s, d) => s + d.balanceDue, 0));
      if (outstanding <= 0) {
        throw new ApiError(400, "This vendor has no pending balance");
      }
      if (amount > outstanding) {
        throw new ApiError(
          400,
          `Amount exceeds the vendor's pending balance of ₹${outstanding.toLocaleString("en-IN")}`
        );
      }

      let remaining = amount;
      const allocations: { saleId: unknown; amount: number }[] = [];
      const updated = [];
      for (const sale of pending) {
        if (remaining <= 0) break;
        const applied = round2(Math.min(remaining, sale.balanceDue));
        sale.amountCollected = round2(sale.amountCollected + applied);
        sale.balanceDue = round2(sale.balanceDue - applied);
        await sale.save({ session });
        allocations.push({ saleId: sale._id, amount: applied });
        updated.push(sale);
        remaining = round2(remaining - applied);
      }

      const [payment] = await Payment.create(
        [
          {
            vendorId: input.vendorId,
            amount,
            method: input.method,
            date: input.date,
            reference: input.reference ?? "",
            notes: input.notes ?? "",
            allocations,
          },
        ],
        { session }
      );
      result = { payment, sales: updated };
    });
    return result;
  } finally {
    await session.endSession();
  }
}

/**
 * Deletes a payment and puts back exactly what it had applied to each sale.
 * Sales deleted since then are skipped. Returns the sales whose balances changed.
 */
export async function deletePayment(id: string) {
  await connectDB();
  if (!mongoose.isValidObjectId(id)) throw new ApiError(404, "Payment not found");

  const session = await mongoose.startSession();
  try {
    let restored: unknown[] = [];
    await session.withTransaction(async () => {
      const payment = await Payment.findById(id).session(session);
      if (!payment) throw new ApiError(404, "Payment not found");

      const changed = [];
      for (const a of payment.allocations as { saleId: unknown; amount: number }[]) {
        const sale = await Sale.findById(a.saleId).session(session);
        if (!sale) continue;
        sale.amountCollected = round2(Math.max(0, sale.amountCollected - a.amount));
        sale.balanceDue = round2(Math.min(sale.netPayable, sale.balanceDue + a.amount));
        await sale.save({ session });
        changed.push(sale);
      }
      await payment.deleteOne({ session });
      restored = changed;
    });
    return { id, sales: restored };
  } finally {
    await session.endSession();
  }
}
