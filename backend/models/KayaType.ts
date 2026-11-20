import { Schema, deleteModel, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

/** A kola category (kaya type) that can be picked on a sale, e.g. "ഏത്തൻ". */
const KayaTypeSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    // Lower-cased name, so "Robusta" and "robusta " count as the same category.
    nameKey: { type: String, required: true, unique: true, select: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

KayaTypeSchema.plugin(toJSONPlugin);

if (process.env.NODE_ENV !== "production" && models.KayaType) {
  deleteModel("KayaType");
}

export const KayaType = models.KayaType ?? model("KayaType", KayaTypeSchema, "kayatypes");
