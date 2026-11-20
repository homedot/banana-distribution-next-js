import { Schema, deleteModel, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const CustomFieldSchema = new Schema(
  {
    id: { type: String, required: true },
    label: { type: String, default: "" },
    value: { type: String, default: "" },
  },
  { _id: false },
);

const SaleKayaItemSchema = new Schema(
  {
    kayaType: { type: String, required: true, trim: true },
    kolaQuantity: { type: Number, required: true, min: 0 },
    // Optional so items saved before per-kaya quality still validate.
    qualityCategory: { type: String, enum: ["Grade A", "Grade B", "Mixed"] },
    // Optional so items saved before per-kaya pricing still validate.
    totalWeight: { type: Number, min: 0 },
    sellingRate: { type: Number, min: 0 },
  },
  { _id: false },
);

const PaymentDetailsSchema = new Schema(
  {
    upiId: { type: String, default: "", trim: true },
    upiTransactionId: { type: String, default: "", trim: true },
    bankName: { type: String, default: "", trim: true },
    accountHolderName: { type: String, default: "", trim: true },
    accountNumber: { type: String, default: "", trim: true },
    ifscCode: { type: String, default: "", trim: true, uppercase: true },
    bankReference: { type: String, default: "", trim: true },
  },
  { _id: false },
);

const SaleSchema = new Schema(
  {
    vendorId: { type: Schema.Types.ObjectId, ref: "Vendor", required: true },
    // Optional: new sales no longer pick a stock batch; older sales keep theirs.
    batchId: { type: Schema.Types.ObjectId, ref: "Batch", default: null },
    // Display label: the selected kaya types joined with ", " (kept for older screens/queries).
    kayaType: { type: String, required: true, trim: true },
    // Every kaya type in this sale. Older sales only have `kayaType`.
    kayaTypes: { type: [String], default: [] },
    // Kola quantity per kaya type; `kolaQuantity` holds their total. Older sales don't have it.
    kayaItems: { type: [SaleKayaItemSchema], default: [] },
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
    paymentDetails: { type: PaymentDetailsSchema, default: () => ({}) },
    balanceDue: { type: Number, default: 0, min: 0 },
    customFields: { type: [CustomFieldSchema], default: [] },
    notes: { type: String, default: "" },
    date: { type: Date, required: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } },
);

SaleSchema.plugin(toJSONPlugin);

// In dev, drop the cached model so schema edits apply on hot reload
// (otherwise Mongoose keeps the old compiled schema until a server restart).
if (process.env.NODE_ENV !== "production" && models.Sale) {
  deleteModel("Sale");
}

export const Sale = models.Sale ?? model("Sale", SaleSchema, "distributions");
