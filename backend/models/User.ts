import { Schema, model, models } from "mongoose";
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
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

UserSchema.plugin(toJSONPlugin);

export const User = models.User ?? model("User", UserSchema);
