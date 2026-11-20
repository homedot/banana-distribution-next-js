import { connectDB } from "@/backend/config/db";
import { KayaType } from "@/backend/models/KayaType";
import { ApiError } from "@/backend/utils/ApiError";

/** The categories the app shipped with; added once when the collection is empty. */
const DEFAULT_KAYA_TYPES = ["ഏത്തൻ", "ഞാലി", "റോബസ്റ്റ", "ചെറുകായ", "പൂവൻ"];

export interface KayaTypeInput {
  name: string;
}

function normalizeName(raw: unknown): { name: string; nameKey: string } {
  const name = String(raw ?? "").trim().replace(/\s+/g, " ");
  if (!name) throw new ApiError(400, "Enter a kola category name");
  if (name.length > 60) throw new ApiError(400, "Kola category name is too long (max 60 characters)");
  return { name, nameKey: name.toLocaleLowerCase() };
}

async function seedDefaultsIfEmpty() {
  if ((await KayaType.estimatedDocumentCount()) > 0) return;
  try {
    await KayaType.insertMany(
      DEFAULT_KAYA_TYPES.map((n) => normalizeName(n)),
      { ordered: false },
    );
  } catch (err) {
    // Two first requests racing each other: the duplicates are expected.
    if ((err as { code?: number }).code !== 11000) throw err;
  }
}

export async function listKayaTypes() {
  await connectDB();
  await seedDefaultsIfEmpty();
  return KayaType.find().sort({ createdAt: 1, _id: 1 });
}

export async function createKayaType(input: KayaTypeInput) {
  await connectDB();
  await seedDefaultsIfEmpty();
  const fields = normalizeName(input?.name);
  if (await KayaType.exists({ nameKey: fields.nameKey })) {
    throw new ApiError(409, `"${fields.name}" is already in the list`);
  }
  try {
    return await KayaType.create(fields);
  } catch (err) {
    if ((err as { code?: number }).code === 11000) {
      throw new ApiError(409, `"${fields.name}" is already in the list`);
    }
    throw err;
  }
}

/**
 * Removes the category from the New Sale list. Past sales keep the name they
 * were saved with (sales store the name, not a reference), so nothing breaks.
 */
export async function deleteKayaType(id: string) {
  await connectDB();
  const kaya = await KayaType.findByIdAndDelete(id);
  if (!kaya) throw new ApiError(404, "Kola category not found");
  return kaya;
}
