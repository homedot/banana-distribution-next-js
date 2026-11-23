import { Schema, deleteModel, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

/** One field that an update changed: its value before and after. */
const ChangeSchema = new Schema(
  {
    field: { type: String, required: true },
    from: { type: Schema.Types.Mixed, default: null },
    to: { type: Schema.Types.Mixed, default: null },
  },
  { _id: false },
);

/**
 * An audit trail entry: who created, edited or deleted which record, and when.
 * Written by the controllers after a change succeeds; read by the admin-only
 * Activity Log screen. Entries are never edited.
 */
const ActivityLogSchema = new Schema(
  {
    userId: { type: String, required: true },
    userEmail: { type: String, required: true },
    userRole: { type: String, enum: ["admin", "accountant"], required: true },
    action: { type: String, enum: ["create", "update", "delete"], required: true },
    entity: {
      type: String,
      enum: ["sale", "customer", "payment", "kola_category", "broker", "batch"],
      required: true,
    },
    entityId: { type: String, required: true },
    // What the record was, in words, at the time (e.g. the customer's name),
    // so deleted records still read sensibly.
    label: { type: String, default: "" },
    detail: { type: String, default: "" },
    changes: { type: [ChangeSchema], default: [] },
  },
  { timestamps: { createdAt: true, updatedAt: false } },
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ entity: 1, entityId: 1, createdAt: -1 });

ActivityLogSchema.plugin(toJSONPlugin);

if (process.env.NODE_ENV !== "production" && models.ActivityLog) {
  deleteModel("ActivityLog");
}

export const ActivityLog = models.ActivityLog ?? model("ActivityLog", ActivityLogSchema, "activity_logs");
