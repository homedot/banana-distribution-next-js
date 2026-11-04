import type { AppData, Broker, BrokerBatch, Distribution, Vendor } from "@/src/types";
import { batchRemainingKolas, paymentStatus } from "@/src/utils/calculations";

export function getBroker(data: AppData, brokerId: string): Broker | undefined {
  return data.brokers.find((b) => b.id === brokerId);
}

export function getVendor(data: AppData, vendorId: string): Vendor | undefined {
  return data.vendors.find((v) => v.id === vendorId);
}

export function getBatch(data: AppData, batchId: string): BrokerBatch | undefined {
  return data.batches.find((b) => b.id === batchId);
}

export function getDistribution(data: AppData, id: string): Distribution | undefined {
  return data.distributions.find((d) => d.id === id);
}

export function distributionRefs(data: AppData, distribution: Distribution) {
  const batch = getBatch(data, distribution.batchId);
  const broker = batch ? getBroker(data, batch.brokerId) : undefined;
  const vendor = getVendor(data, distribution.vendorId);
  return { batch, broker, vendor };
}

export function sortedDistributions(data: AppData): Distribution[] {
  return [...data.distributions].sort((a, b) =>
    b.date.localeCompare(a.date)
  );
}

export interface DashboardStats {
  totalDistributions: number;
  totalKolas: number;
  totalWeightKg: number;
  pendingCount: number;
  completedCount: number;
  totalCollected: number;
  totalPending: number;
  totalNetPayable: number;
  activeBrokers: number;
  activeVendors: number;
}

export function getDashboardStats(data: AppData): DashboardStats {
  let totalKolas = 0;
  let totalWeightKg = 0;
  let pendingCount = 0;
  let completedCount = 0;
  let totalCollected = 0;
  let totalPending = 0;
  let totalNetPayable = 0;

  for (const d of data.distributions) {
    totalKolas += d.kolaQuantity;
    totalWeightKg += d.totalWeight;
    totalCollected += d.amountCollected;
    totalPending += d.balanceDue;
    totalNetPayable += d.netPayable;
    if (paymentStatus(d) === "paid") completedCount += 1;
    else pendingCount += 1;
  }

  const activeVendorIds = new Set(data.distributions.map((d) => d.vendorId));
  const activeBrokerIds = new Set(
    data.batches
      .filter((b) => data.distributions.some((d) => d.batchId === b.id))
      .map((b) => b.brokerId)
  );

  return {
    totalDistributions: data.distributions.length,
    totalKolas,
    totalWeightKg,
    pendingCount,
    completedCount,
    totalCollected,
    totalPending,
    totalNetPayable,
    activeBrokers: activeBrokerIds.size,
    activeVendors: activeVendorIds.size,
  };
}

export interface BrokerSummary {
  broker: Broker;
  batches: {
    batch: BrokerBatch;
    dispatchedKolas: number;
    remainingKolas: number;
    distributions: Distribution[];
  }[];
  inwardKolas: number;
  dispatchedKolas: number;
  remainingKolas: number;
  totalCollected: number;
  totalPending: number;
}

export function getBrokerSummaries(data: AppData): BrokerSummary[] {
  return data.brokers.map((broker) => {
    const brokerBatches = data.batches.filter((b) => b.brokerId === broker.id);
    const batches = brokerBatches.map((batch) => {
      const distributions = data.distributions.filter(
        (d) => d.batchId === batch.id
      );
      const dispatchedKolas = distributions.reduce(
        (sum, d) => sum + d.kolaQuantity,
        0
      );
      return {
        batch,
        dispatchedKolas,
        remainingKolas: batchRemainingKolas(batch, data.distributions),
        distributions,
      };
    });

    const inwardKolas = batches.reduce((s, b) => s + b.batch.inwardQtyKolas, 0);
    const dispatchedKolas = batches.reduce((s, b) => s + b.dispatchedKolas, 0);
    const remainingKolas = batches.reduce((s, b) => s + b.remainingKolas, 0);
    const allDistributions = batches.flatMap((b) => b.distributions);
    const totalCollected = allDistributions.reduce(
      (s, d) => s + d.amountCollected,
      0
    );
    const totalPending = allDistributions.reduce((s, d) => s + d.balanceDue, 0);

    return {
      broker,
      batches,
      inwardKolas,
      dispatchedKolas,
      remainingKolas,
      totalCollected,
      totalPending,
    };
  });
}

export function getBrokerSummary(
  data: AppData,
  brokerId: string
): BrokerSummary | undefined {
  return getBrokerSummaries(data).find((s) => s.broker.id === brokerId);
}

export interface VendorSummary {
  vendor: Vendor;
  distributions: Distribution[];
  totalKolas: number;
  totalNetPayable: number;
  totalCollected: number;
  totalPending: number;
  lastActivity: string | null;
}

export function getVendorSummaries(data: AppData): VendorSummary[] {
  return data.vendors.map((vendor) => {
    const distributions = data.distributions
      .filter((d) => d.vendorId === vendor.id)
      .sort((a, b) => b.date.localeCompare(a.date));
    const totalKolas = distributions.reduce((s, d) => s + d.kolaQuantity, 0);
    const totalNetPayable = distributions.reduce((s, d) => s + d.netPayable, 0);
    const totalCollected = distributions.reduce(
      (s, d) => s + d.amountCollected,
      0
    );
    const totalPending = distributions.reduce((s, d) => s + d.balanceDue, 0);

    return {
      vendor,
      distributions,
      totalKolas,
      totalNetPayable,
      totalCollected,
      totalPending,
      lastActivity: distributions[0]?.date ?? null,
    };
  });
}

export function getVendorSummary(
  data: AppData,
  vendorId: string
): VendorSummary | undefined {
  return getVendorSummaries(data).find((s) => s.vendor.id === vendorId);
}

export function groupDistributionsByDay(
  distributions: Distribution[]
): { date: string; distributions: Distribution[] }[] {
  const map = new Map<string, Distribution[]>();
  for (const d of distributions) {
    const day = d.date.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(d);
    map.set(day, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, distributions: items }));
}
