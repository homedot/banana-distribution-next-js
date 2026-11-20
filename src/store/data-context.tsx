"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AppData, Broker, BrokerBatch, KayaType, Payment, PaymentInput, Sale, Vendor } from "@/src/types";
import { api } from "@/src/lib/api";
import { withLoading } from "@/src/store/loading";

const emptyData: AppData = { kayaTypes: [], brokers: [], batches: [], vendors: [], sales: [], payments: [] };

interface DataContextValue {
  data: AppData;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  addSale: (
    input: Omit<Sale, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Sale>;
  updateSale: (
    id: string,
    input: Omit<Sale, "id" | "createdAt" | "updatedAt">,
  ) => Promise<Sale>;
  deleteSale: (id: string) => Promise<void>;
  addVendor: (input: Omit<Vendor, "id" | "createdAt">) => Promise<Vendor>;
  updateVendor: (id: string, input: Omit<Vendor, "id" | "createdAt">) => Promise<Vendor>;
  addBroker: (input: Omit<Broker, "id" | "createdAt">) => Promise<Broker>;
  addBatch: (input: Omit<BrokerBatch, "id">) => Promise<BrokerBatch>;
  addPayment: (input: PaymentInput) => Promise<Payment>;
  deletePayment: (id: string) => Promise<void>;
  addKayaType: (name: string) => Promise<KayaType>;
  deleteKayaType: (id: string) => Promise<void>;
}

/** Replaces sales in state with the server's updated copies (matched by id). */
function mergeSales(current: Sale[], changed: Sale[]): Sale[] {
  if (changed.length === 0) return current;
  const byId = new Map(changed.map((s) => [s.id, s]));
  return current.map((s) => byId.get(s.id) ?? s);
}

async function fetchAppData(): Promise<AppData> {
  const [kayaTypes, brokers, vendors, batches, sales, payments] = await Promise.all([
    api.kayaTypes.list(),
    api.brokers.list(),
    api.vendors.list(),
    api.batches.list(),
    api.sales.list(),
    api.payments.list(),
  ]);
  return { kayaTypes, brokers, vendors, batches, sales, payments };
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
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load data"),
      )
      .finally(() => setLoading(false));
  }, []);

  // Every write runs inside withLoading(), which shows the full-screen
  // loading overlay until the server responds.

  const addSale = useCallback<DataContextValue["addSale"]>(
    (input) =>
      withLoading("Saving sale…", async () => {
        const created = await api.sales.create(input);
        setData((prev) => ({ ...prev, sales: [created, ...prev.sales] }));
        return created;
      }),
    [],
  );

  const updateSale = useCallback<DataContextValue["updateSale"]>(
    (id, input) =>
      withLoading("Updating sale…", async () => {
        const updated = await api.sales.update(id, input);
        setData((prev) => ({
          ...prev,
          sales: prev.sales.map((d) => (d.id === id ? updated : d)),
        }));
        return updated;
      }),
    [],
  );

  const deleteSale = useCallback<DataContextValue["deleteSale"]>(
    (id) =>
      withLoading("Deleting sale…", async () => {
        await api.sales.remove(id);
        setData((prev) => ({
          ...prev,
          sales: prev.sales.filter((d) => d.id !== id),
        }));
      }),
    [],
  );

  const addVendor = useCallback<DataContextValue["addVendor"]>(
    (input) =>
      withLoading("Saving customer…", async () => {
        const created = await api.vendors.create(input);
        setData((prev) => ({ ...prev, vendors: [...prev.vendors, created] }));
        return created;
      }),
    [],
  );

  const updateVendor = useCallback<DataContextValue["updateVendor"]>(
    (id, input) =>
      withLoading("Updating customer…", async () => {
        const updated = await api.vendors.update(id, input);
        setData((prev) => ({
          ...prev,
          vendors: prev.vendors.map((v) => (v.id === id ? updated : v)),
        }));
        return updated;
      }),
    [],
  );

  const addBroker = useCallback<DataContextValue["addBroker"]>(
    (input) =>
      withLoading("Saving broker…", async () => {
        const created = await api.brokers.create(input);
        setData((prev) => ({ ...prev, brokers: [...prev.brokers, created] }));
        return created;
      }),
    [],
  );

  const addBatch = useCallback<DataContextValue["addBatch"]>(
    (input) =>
      withLoading("Saving stock entry…", async () => {
        const created = await api.batches.create(input);
        setData((prev) => ({ ...prev, batches: [created, ...prev.batches] }));
        return created;
      }),
    [],
  );

  const addPayment = useCallback<DataContextValue["addPayment"]>(
    (input) =>
      withLoading("Saving payment…", async () => {
        const { payment, sales } = await api.payments.create(input);
        setData((prev) => ({
          ...prev,
          payments: [payment, ...prev.payments],
          sales: mergeSales(prev.sales, sales),
        }));
        return payment;
      }),
    [],
  );

  const deletePayment = useCallback<DataContextValue["deletePayment"]>(
    (id) =>
      withLoading("Deleting payment…", async () => {
        const { sales } = await api.payments.remove(id);
        setData((prev) => ({
          ...prev,
          payments: prev.payments.filter((p) => p.id !== id),
          sales: mergeSales(prev.sales, sales),
        }));
      }),
    [],
  );

  const addKayaType = useCallback<DataContextValue["addKayaType"]>(
    (name) =>
      withLoading("Saving kola category…", async () => {
        const created = await api.kayaTypes.create(name);
        setData((prev) => ({ ...prev, kayaTypes: [...prev.kayaTypes, created] }));
        return created;
      }),
    [],
  );

  const deleteKayaType = useCallback<DataContextValue["deleteKayaType"]>(
    (id) =>
      withLoading("Removing kola category…", async () => {
        await api.kayaTypes.remove(id);
        setData((prev) => ({
          ...prev,
          kayaTypes: prev.kayaTypes.filter((k) => k.id !== id),
        }));
      }),
    [],
  );

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      error,
      refresh,
      addSale,
      updateSale,
      deleteSale,
      addVendor,
      updateVendor,
      addBroker,
      addBatch,
      addPayment,
      deletePayment,
      addKayaType,
      deleteKayaType,
    }),
    [
      data,
      loading,
      error,
      refresh,
      addSale,
      updateSale,
      deleteSale,
      addVendor,
      updateVendor,
      addBroker,
      addBatch,
      addPayment,
      deletePayment,
      addKayaType,
      deleteKayaType,
    ],
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
