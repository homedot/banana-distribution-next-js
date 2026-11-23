import mongoose from "mongoose";
import { connectDB } from "@/backend/config/db";
import { ActivityLog } from "@/backend/models/ActivityLog";
import { Sale } from "@/backend/models/Sale";
import { Vendor } from "@/backend/models/Vendor";
import { Payment } from "@/backend/models/Payment";
import { KayaType } from "@/backend/models/KayaType";
import { Broker } from "@/backend/models/Broker";
import { Batch } from "@/backend/models/Batch";
import type { Actor } from "@/backend/utils/actor";

export type ActivityAction = "create" | "update" | "delete";
export type ActivityEntity = "sale" | "customer" | "payment" | "kola_category" | "broker" | "batch";

type Plain = Record<string, unknown>;

const MODELS: Record<ActivityEntity, mongoose.Model<unknown>> = {
  sale: Sale,
  customer: Vendor,
  payment: Payment,
  kola_category: KayaType,
  broker: Broker,
  batch: Batch,
};

// Bookkeeping fields that aren't worth showing as "changed".
const IGNORED_FIELDS = new Set(["id", "createdAt", "updatedAt", "nameKey", "allocations", "kayaType"]);

/** A Mongoose document (or anything with toJSON) as plain JSON: ids and dates become strings. */
export function plain(doc: unknown): Plain | null {
  if (!doc) return null;
  return JSON.parse(JSON.stringify(doc)) as Plain;
}

/** The record as it is right now, for diffing against after an update. Null if not found. */
export async function snapshot(entity: ActivityEntity, id: string): Promise<Plain | null> {
  if (!mongoose.isValidObjectId(id)) return null;
  await connectDB();
  try {
    return plain(await MODELS[entity].findById(id));
  } catch {
    return null;
  }
}

/** Flattens one level of nesting (paymentDetails.upiId) so sub-field edits show individually. */
function flatten(obj: Plain): Plain {
  const out: Plain = {};
  for (const [key, value] of Object.entries(obj)) {
    if (IGNORED_FIELDS.has(key)) continue;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      for (const [sub, v] of Object.entries(value as Plain)) out[`${key}.${sub}`] = v;
    } else {
      out[key] = value;
    }
  }
  return out;
}

/** undefined, null, "" and [] all mean "nothing", so legacy defaults don't show as edits. */
function isEmpty(v: unknown) {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** The fields that differ between two versions of a record. */
export function diff(before: Plain | null, after: Plain | null) {
  const a = flatten(before ?? {});
  const b = flatten(after ?? {});
  const changes: { field: string; from: unknown; to: unknown }[] = [];
  for (const field of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const from = a[field];
    const to = b[field];
    if (isEmpty(from) && isEmpty(to)) continue;
    // A field older records lack, now saved with its default of 0, isn't an edit.
    if ((isEmpty(from) && to === 0) || (from === 0 && isEmpty(to))) continue;
    if (JSON.stringify(from) === JSON.stringify(to)) continue;
    changes.push({ field, from: from ?? null, to: to ?? null });
  }
  return changes;
}

const money = (n: unknown) => `₹${(Number(n) || 0).toLocaleString("en-IN")}`;
const day = (iso: unknown) => (typeof iso === "string" ? iso.slice(0, 10) : "");

async function vendorName(vendorId: unknown) {
  if (!vendorId || !mongoose.isValidObjectId(vendorId)) return "Unknown customer";
  const v = (await Vendor.findById(vendorId).lean()) as { name?: string } | null;
  return v?.name ?? "Deleted customer";
}

/** A short human description of the record (label) plus a one-line detail. */
async function describe(entity: ActivityEntity, doc: Plain) {
  switch (entity) {
    case "sale":
      return {
        label: await vendorName(doc.vendorId),
        detail: `Sale of ${day(doc.date)} · ${doc.kolaQuantity ?? 0} kolas · ${money(doc.netPayable)}`,
      };
    case "payment":
      return {
        label: await vendorName(doc.vendorId),
        detail: `Payment of ${money(doc.amount)} on ${day(doc.date)}`,
      };
    case "customer":
      return { label: String(doc.name ?? ""), detail: String(doc.location ?? "") };
    case "broker":
      return { label: String(doc.name ?? ""), detail: "" };
    case "kola_category":
      return { label: String(doc.name ?? ""), detail: "" };
    case "batch":
      return { label: String(doc.kayaType ?? "Batch"), detail: `Batch of ${day(doc.date)}` };
  }
}

/**
 * Writes one audit entry. Never throws: a logging failure must not undo or
 * fail the change the user just made, so it's only reported server-side.
 * Updates that changed nothing aren't recorded.
 */
export async function recordActivity(input: {
  actor: Actor;
  action: ActivityAction;
  entity: ActivityEntity;
  before?: Plain | null;
  after?: Plain | null;
}) {
  try {
    const { actor, action, entity } = input;
    const before = input.before ?? null;
    const after = input.after ?? null;
    const doc = after ?? before;
    if (!doc?.id) return;

    const changes = action === "update" ? diff(before, after) : [];
    if (action === "update" && changes.length === 0) return;

    await connectDB();
    const { label, detail } = await describe(entity, doc);
    await ActivityLog.create({
      userId: actor.id,
      userEmail: actor.email,
      userRole: actor.role,
      action,
      entity,
      entityId: String(doc.id),
      label,
      detail,
      changes,
    });
  } catch (err) {
    console.error("[activity] failed to record activity:", err);
  }
}

export interface ListActivityQuery {
  role?: string | null;
  entity?: string | null;
  action?: string | null;
  before?: string | null;
  limit?: number;
}

/** Newest first, paged with `before` (the createdAt of the last entry already shown). */
export async function listActivity(query: ListActivityQuery) {
  await connectDB();
  const filter: Record<string, unknown> = {};
  if (query.role === "admin" || query.role === "accountant") filter.userRole = query.role;
  if (query.entity && query.entity in MODELS) filter.entity = query.entity;
  if (query.action && ["create", "update", "delete"].includes(query.action)) filter.action = query.action;
  if (query.before && !Number.isNaN(new Date(query.before).getTime())) {
    filter.createdAt = { $lt: new Date(query.before) };
  }
  const limit = Math.min(Math.max(Number(query.limit) || 50, 1), 200);
  const items = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  return { items: items.slice(0, limit), hasMore: items.length > limit };
}
