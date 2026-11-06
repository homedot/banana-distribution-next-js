/**
 * Populates MongoDB Atlas with the same demo data the app used to ship with
 * in its localStorage version. Run with `npm run seed`.
 *
 * Re-running this script wipes and re-inserts the four collections, so only
 * run it against a dev/demo database.
 */
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

import { connectDB } from "@/backend/config/db";
import { Broker } from "@/backend/models/Broker";
import { Vendor } from "@/backend/models/Vendor";
import { Batch } from "@/backend/models/Batch";
import { Distribution } from "@/backend/models/Distribution";
import { seedData } from "@/backend/seed/seed-data";

async function main() {
  await connectDB();

  await Promise.all([
    Broker.deleteMany({}),
    Vendor.deleteMany({}),
    Batch.deleteMany({}),
    Distribution.deleteMany({}),
  ]);

  // Brokers and vendors have no cross-references, so they can be inserted
  // directly. Batches/distributions reference them by the seed file's
  // string ids, so we keep an old-id -> new ObjectId map for each.
  const brokerIdMap = new Map<string, string>();
  for (const broker of seedData.brokers) {
    const { id, createdAt, ...rest } = broker;
    const created = await Broker.create({ ...rest, createdAt });
    brokerIdMap.set(id, created.id);
  }

  const vendorIdMap = new Map<string, string>();
  for (const vendor of seedData.vendors) {
    const { id, createdAt, ...rest } = vendor;
    const created = await Vendor.create({ ...rest, createdAt });
    vendorIdMap.set(id, created.id);
  }

  const batchIdMap = new Map<string, string>();
  for (const batch of seedData.batches) {
    const { id, brokerId, ...rest } = batch;
    const mappedBrokerId = brokerIdMap.get(brokerId);
    if (!mappedBrokerId) throw new Error(`Seed error: unknown brokerId ${brokerId}`);
    const created = await Batch.create({ ...rest, brokerId: mappedBrokerId });
    batchIdMap.set(id, created.id);
  }

  for (const distribution of seedData.distributions) {
    const mappedVendorId = vendorIdMap.get(distribution.vendorId);
    const mappedBatchId = batchIdMap.get(distribution.batchId);
    if (!mappedVendorId) throw new Error(`Seed error: unknown vendorId ${distribution.vendorId}`);
    if (!mappedBatchId) throw new Error(`Seed error: unknown batchId ${distribution.batchId}`);
    await Distribution.create({
      vendorId: mappedVendorId,
      batchId: mappedBatchId,
      kayaType: distribution.kayaType,
      qualityCategory: distribution.qualityCategory,
      kolaQuantity: distribution.kolaQuantity,
      totalWeight: distribution.totalWeight,
      thanduCount: distribution.thanduCount,
      rateBasis: distribution.rateBasis,
      dailySellingRate: distribution.dailySellingRate,
      grossTotal: distribution.grossTotal,
      discount: distribution.discount,
      netPayable: distribution.netPayable,
      amountCollected: distribution.amountCollected,
      paymentMethod: distribution.paymentMethod,
      balanceDue: distribution.balanceDue,
      customFields: distribution.customFields,
      notes: distribution.notes,
      date: distribution.date,
      createdAt: distribution.createdAt,
      updatedAt: distribution.updatedAt,
    });
  }

  console.log(
    `Seeded ${brokerIdMap.size} brokers, ${vendorIdMap.size} vendors, ${batchIdMap.size} batches, ${seedData.distributions.length} distributions.`
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
