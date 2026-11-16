import { Schema, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

/** How much of a payment was applied to one sale's balance. */
const AllocationSchema = new Schema(
  {
    saleId: { type: Schema.Types.ObjectId, ref: "Sale", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PaymentSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    method: { type: String, enum: ["cash", "upi", "bank_transfer"], required: true },
    date: { type: Date, required: true },
    reference: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    allocations: { type: [AllocationSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

PaymentSchema.plugin(toJSONPlugin);

export const Payment = models.Payment ?? model("Payment", PaymentSchema);
