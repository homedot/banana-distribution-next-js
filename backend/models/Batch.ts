import { Schema, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const BatchSchema = new Schema({
  brokerId: { type: Schema.Types.ObjectId, ref: "Broker", required: true },
  kayaType: { type: String, required: true, trim: true },
  inwardQtyKolas: { type: Number, required: true, min: 0 },
  totalWeightKg: { type: Number, required: true, min: 0 },
  thanduPerKola: { type: Number, default: 1, min: 0 },
  ratePerKola: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  status: { type: String, enum: ["active", "closed"], default: "active" },
});

BatchSchema.plugin(toJSONPlugin);

export const Batch = models.Batch ?? model("Batch", BatchSchema);
