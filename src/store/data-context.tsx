"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  AppData,
  Broker,
  BrokerBatch,
  Distribution,
  Vendor,
} from "@/src/types";
import { api } from "@/src/lib/api";

const emptyData: AppData = { brokers: [], batches: [], vendors: [], distributions: [] };

interface DataContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addDistribution: (
    input: Omit<Distribution, "id" | "createdAt" | "updatedAt">
  ) => Promise<Distribution>;
  updateDistribution: (
    id: string,
    input: Omit<Distribution, "id" | "createdAt" | "updatedAt">
  ) => Promise<Distribution>;
  deleteDistribution: (id: string) => Promise<void>;
  addVendor: (input: Omit<Vendor, "id" | "createdAt">) => Promise<Vendor>;
  addBroker: (input: Omit<Broker, "id" | "createdAt">) => Promise<Broker>;
  addBatch: (input: Omit<BrokerBatch, "id">) => Promise<BrokerBatch>;
}

async function fetchAppData(): Promise<AppData> {
  const [brokers, vendors, batches, distributions] = await Promise.all([
    api.brokers.list(),
    api.vendors.list(),
    api.batches.list(),
    api.distributions.list(),
  ]);
  return { brokers, vendors, batches, distributions };
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches once on mount, following the pattern from
  // https://react.dev/learn/you-might-not-need-an-effect#fetching-data —
  // the `ignore` flag stops a stale response from a prior render overwriting
  // a newer one if this effect ever re-runs.
  useEffect(() => {
    let ignore = false;

    async function load() {
      try {
        const nextData = await fetchAppData();
        if (!ignore) {
          setData(nextData);
          setLoading(false);
        }
      } catch (err) {
        if (!ignore) {
          setError(err instanceof Error ? err.message : "Failed to load data");
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, []);

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);
    fetchAppData()
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load data"))
      .finally(() => setLoading(false));
  }, []);

  const addDistribution = useCallback<DataContextValue["addDistribution"]>(
    async (input) => {
      const created = await api.distributions.create(input);
      setData((prev) => ({
        ...prev,
        distributions: [created, ...prev.distributions],
      }));
      return created;
    },
    []
  );

  const updateDistribution = useCallback<
    DataContextValue["updateDistribution"]
  >(async (id, input) => {
    const updated = await api.distributions.update(id, input);
    setData((prev) => ({
      ...prev,
      distributions: prev.distributions.map((d) => (d.id === id ? updated : d)),
    }));
    return updated;
  }, []);

  const deleteDistribution = useCallback<
    DataContextValue["deleteDistribution"]
  >(async (id) => {
    await api.distributions.remove(id);
    setData((prev) => ({
      ...prev,
      distributions: prev.distributions.filter((d) => d.id !== id),
    }));
  }, []);

  const addVendor = useCallback<DataContextValue["addVendor"]>(async (input) => {
    const created = await api.vendors.create(input);
    setData((prev) => ({ ...prev, vendors: [...prev.vendors, created] }));
    return created;
  }, []);

  const addBroker = useCallback<DataContextValue["addBroker"]>(async (input) => {
    const created = await api.brokers.create(input);
    setData((prev) => ({ ...prev, brokers: [...prev.brokers, created] }));
    return created;
  }, []);

  const addBatch = useCallback<DataContextValue["addBatch"]>(async (input) => {
    const created = await api.batches.create(input);
    setData((prev) => ({ ...prev, batches: [created, ...prev.batches] }));
    return created;
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      error,
      refresh,
      addDistribution,
      updateDistribution,
      deleteDistribution,
      addVendor,
      addBroker,
      addBatch,
    }),
    [
      data,
      loading,
      error,
      refresh,
      addDistribution,
      updateDistribution,
      deleteDistribution,
      addVendor,
      addBroker,
      addBatch,
    ]
  );

  // Always render children — gating them behind the loading/error state would
  // mean the route tree never renders on the server (loading starts true
  // there), which breaks static-shell generation and instant navigation.
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useAppData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) {
    throw new Error("useAppData must be used within a DataProvider");
  }
  return ctx;
}
