import type { AppData, Broker, BrokerBatch, Sale, Vendor } from "@/src/types";
import { batchRemainingKolas, paymentStatus } from "@/src/utils/calculations";

export function getBroker(data: AppData, brokerId: string): Broker | undefined {
  return data.brokers.find((b) => b.id === brokerId);
}

export function getVendor(data: AppData, vendorId: string): Vendor | undefined {
  return data.vendors.find((v) => v.id === vendorId);
}

export function getBatch(
  data: AppData,
  batchId: string | null | undefined,
): BrokerBatch | undefined {
  if (!batchId) return undefined;
  return data.batches.find((b) => b.id === batchId);
}

export function getSale(data: AppData, id: string): Sale | undefined {
  return data.sales.find((d) => d.id === id);
}

export function saleRefs(data: AppData, sale: Sale) {
  const batch = getBatch(data, sale.batchId);
  const broker = batch ? getBroker(data, batch.brokerId) : undefined;
  const vendor = getVendor(data, sale.vendorId);
  return { batch, broker, vendor };
}

export function sortedSales(data: AppData): Sale[] {
  return [...data.sales].sort((a, b) => b.date.localeCompare(a.date));
}

export interface DashboardStats {
  totalSales: number;
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

  for (const d of data.sales) {
    totalKolas += d.kolaQuantity;
    totalWeightKg += d.totalWeight;
    totalCollected += d.amountCollected;
    totalPending += d.balanceDue;
    totalNetPayable += d.netPayable;
    if (paymentStatus(d) === "paid") completedCount += 1;
    else pendingCount += 1;
  }

  const activeVendorIds = new Set(data.sales.map((d) => d.vendorId));
  const activeBrokerIds = new Set(
    data.batches
      .filter((b) => data.sales.some((d) => d.batchId === b.id))
      .map((b) => b.brokerId),
  );

  return {
    totalSales: data.sales.length,
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
    sales: Sale[];
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
      const sales = data.sales.filter((d) => d.batchId === batch.id);
      const dispatchedKolas = sales.reduce((sum, d) => sum + d.kolaQuantity, 0);
      return {
        batch,
        dispatchedKolas,
        remainingKolas: batchRemainingKolas(batch, data.sales),
        sales,
      };
    });

    const inwardKolas = batches.reduce((s, b) => s + b.batch.inwardQtyKolas, 0);
    const dispatchedKolas = batches.reduce((s, b) => s + b.dispatchedKolas, 0);
    const remainingKolas = batches.reduce((s, b) => s + b.remainingKolas, 0);
    const allSales = batches.flatMap((b) => b.sales);
    const totalCollected = allSales.reduce((s, d) => s + d.amountCollected, 0);
    const totalPending = allSales.reduce((s, d) => s + d.balanceDue, 0);

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
  brokerId: string,
): BrokerSummary | undefined {
  return getBrokerSummaries(data).find((s) => s.broker.id === brokerId);
}

export interface VendorSummary {
  vendor: Vendor;
  sales: Sale[];
  totalKolas: number;
  totalNetPayable: number;
  totalCollected: number;
  totalPending: number;
  lastActivity: string | null;
}

export function getVendorSummaries(data: AppData): VendorSummary[] {
  return data.vendors.map((vendor) => {
    const sales = data.sales.filter((d) => d.vendorId === vendor.id).sort(
      (a, b) => b.date.localeCompare(a.date),
    );
    const totalKolas = sales.reduce((s, d) => s + d.kolaQuantity, 0);
    const totalNetPayable = sales.reduce((s, d) => s + d.netPayable, 0);
    const totalCollected = sales.reduce((s, d) => s + d.amountCollected, 0);
    const totalPending = sales.reduce((s, d) => s + d.balanceDue, 0);

    return {
      vendor,
      sales,
      totalKolas,
      totalNetPayable,
      totalCollected,
      totalPending,
      lastActivity: sales[0]?.date ?? null,
    };
  });
}

export function getVendorSummary(
  data: AppData,
  vendorId: string,
): VendorSummary | undefined {
  return getVendorSummaries(data).find((s) => s.vendor.id === vendorId);
}

export function groupSalesByDay(
  sales: Sale[],
): { date: string; sales: Sale[] }[] {
  const map = new Map<string, Sale[]>();
  for (const d of sales) {
    const day = d.date.slice(0, 10);
    const list = map.get(day) ?? [];
    list.push(d);
    map.set(day, list);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, items]) => ({ date, sales: items }));
}
