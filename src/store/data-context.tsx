"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";
import type {
  AppData,
  Broker,
  BrokerBatch,
  Distribution,
  Vendor,
} from "@/src/types";
import {
  getServerSnapshot,
  getSnapshot,
  mutate,
  resetToSeed,
  subscribe,
} from "@/src/store/local-store";
import { generateId } from "@/src/utils/id";

interface DataContextValue {
  data: AppData;
  addDistribution: (
    input: Omit<Distribution, "id" | "createdAt" | "updatedAt">
  ) => Distribution;
  updateDistribution: (
    id: string,
    input: Omit<Distribution, "id" | "createdAt" | "updatedAt">
  ) => void;
  deleteDistribution: (id: string) => void;
  addVendor: (input: Omit<Vendor, "id" | "createdAt">) => Vendor;
  addBroker: (input: Omit<Broker, "id" | "createdAt">) => Broker;
  addBatch: (input: Omit<BrokerBatch, "id">) => BrokerBatch;
  resetDemoData: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const data = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addDistribution = useCallback<DataContextValue["addDistribution"]>(
    (input) => {
      const now = new Date().toISOString();
      const record: Distribution = {
        ...input,
        id: generateId("dist"),
        createdAt: now,
        updatedAt: now,
      };
      mutate((prev) => ({
        ...prev,
        distributions: [record, ...prev.distributions],
      }));
      return record;
    },
    []
  );

  const updateDistribution = useCallback<
    DataContextValue["updateDistribution"]
  >((id, input) => {
    mutate((prev) => ({
      ...prev,
      distributions: prev.distributions.map((d) =>
        d.id === id
          ? { ...input, id, createdAt: d.createdAt, updatedAt: new Date().toISOString() }
          : d
      ),
    }));
  }, []);

  const deleteDistribution = useCallback((id: string) => {
    mutate((prev) => ({
      ...prev,
      distributions: prev.distributions.filter((d) => d.id !== id),
    }));
  }, []);

  const addVendor = useCallback<DataContextValue["addVendor"]>((input) => {
    const record: Vendor = {
      ...input,
      id: generateId("ven"),
      createdAt: new Date().toISOString(),
    };
    mutate((prev) => ({ ...prev, vendors: [...prev.vendors, record] }));
    return record;
  }, []);

  const addBroker = useCallback<DataContextValue["addBroker"]>((input) => {
    const record: Broker = {
      ...input,
      id: generateId("brk"),
      createdAt: new Date().toISOString(),
    };
    mutate((prev) => ({ ...prev, brokers: [...prev.brokers, record] }));
    return record;
  }, []);

  const addBatch = useCallback<DataContextValue["addBatch"]>((input) => {
    const record: BrokerBatch = { ...input, id: generateId("bat") };
    mutate((prev) => ({ ...prev, batches: [record, ...prev.batches] }));
    return record;
  }, []);

  const resetDemoData = useCallback(() => {
    resetToSeed();
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      addDistribution,
      updateDistribution,
      deleteDistribution,
      addVendor,
      addBroker,
      addBatch,
      resetDemoData,
    }),
    [
      data,
      addDistribution,
      updateDistribution,
      deleteDistribution,
      addVendor,
      addBroker,
      addBatch,
      resetDemoData,
    ]
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within a DataProvider");
  }
  return ctx;
}
