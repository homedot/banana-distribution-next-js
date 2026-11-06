import { Schema, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const VendorSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    location: { type: String, required: true, trim: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

VendorSchema.plugin(toJSONPlugin);

export const Vendor = models.Vendor ?? model("Vendor", VendorSchema);
