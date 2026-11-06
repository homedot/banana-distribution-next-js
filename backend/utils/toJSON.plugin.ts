import type { Schema } from "mongoose";

/**
 * Makes every model's JSON output match the frontend's types: `id` instead
 * of `_id`, no `__v`. Apply with `schema.plugin(toJSONPlugin)`.
 */
export function toJSONPlugin(schema: Schema) {
  schema.set("toJSON", {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = (ret._id as { toString(): string }).toString();
      delete ret._id;
    },
  });
}
