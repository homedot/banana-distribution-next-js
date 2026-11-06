import { Schema, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const CustomFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  { _id: false }
);

const DistributionSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true },
    kayaType: { type: String, required: true, trim: true },
    qualityCategory: {
      type: String,
      enum: ["Grade A", "Grade B", "Mixed"],
      required: true,
    },
    kolaQuantity: { type: Number, required: true, min: 0 },
    totalWeight: { type: Number, required: true, min: 0 },
    thanduCount: { type: Number, default: 0, min: 0 },
    rateBasis: { type: String, enum: ["per_kola", "per_kg"], required: true },
    dailySellingRate: { type: Number, required: true, min: 0 },
    grossTotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    netPayable: { type: Number, required: true, min: 0 },
    amountCollected: { type: Number, default: 0, min: 0 },
    paymentMethod: {
      type: String,
      enum: ["cash", "upi", "bank_transfer"],
      required: true,
    },
    balanceDue: { type: Number, default: 0, min: 0 },
    customFields: { type: [CustomFieldSchema], default: [] },
    notes: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

DistributionSchema.plugin(toJSONPlugin);

export const Distribution = models.Distribution ?? model("Distribution", DistributionSchema);
