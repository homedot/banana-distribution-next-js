import { Schema, deleteModel, model, models } from "mongoose";
import { toJSONPlugin } from "@/backend/utils/toJSON.plugin";

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    // bcrypt hash — never store or return the plaintext password.
    // select: false keeps it out of query results unless explicitly requested.
    passwordHash: { type: String, required: true, select: false },
    // "admin" sees everything; "accountant" can't open the Dashboard.
    // Users saved before roles existed have none and are treated as admin.
    role: { type: String, enum: ["admin", "accountant"], default: "admin" },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

UserSchema.plugin(toJSONPlugin);

// In dev, drop the cached model so schema edits apply on hot reload
// (otherwise Mongoose keeps the old compiled schema until a server restart).
if (process.env.NODE_ENV !== "production" && models.User) {
  deleteModel("User");
}

export const User = models.User ?? model("User", UserSchema);
