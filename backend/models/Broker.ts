import { Schema, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const BrokerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    location: { type: String, required: true, trim: true },
    vehicleNumber: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

BrokerSchema.plugin(toJSONPlugin);

export const Broker = models.Broker ?? model("Broker", BrokerSchema);
