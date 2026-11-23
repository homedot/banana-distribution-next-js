import { currentPath, goToLogin, readJson } from "@/src/lib/auth-navigation";
import type { ActivityPage, Broker, BrokerBatch, KayaType, Payment, PaymentInput, Sale, Vendor } from "@/src/types";

interface ApiSuccess<T> {
  success: true;
  data: T;
}

interface ApiFailure {
  success: false;
  message: string;
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });

  // Session expired or cookie gone: send the user to sign in, then back here.
  if (res.status === 401) {
    goToLogin(currentPath());
    throw new Error("Your session has expired. Please sign in again.");
  }

  const body = (await readJson(res)) as ApiSuccess<T> | ApiFailure | null;

  if (!res.ok || !body?.success) {
    throw new Error(
      body && !body.success && body.message
        ? body.message
        : `The server couldn't complete the request (error ${res.status}). Please try again.`,
    );
  }

  return body.data;
}

export const api = {
  kayaTypes: {
    list: () => request<KayaType[]>("/api/kaya-types"),
    create: (name: string) =>
      request<KayaType>("/api/kaya-types", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    remove: (id: string) =>
      request<{ id: string }>(`/api/kaya-types/${id}`, { method: "DELETE" }),
  },
  brokers: {
    list: () => request<Broker[]>("/api/brokers"),
    create: (input: Omit<Broker, "id" | "createdAt">) =>
      request<Broker>("/api/brokers", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  vendors: {
    list: () => request<Vendor[]>("/api/vendors"),
    create: (input: Omit<Vendor, "id" | "createdAt">) =>
      request<Vendor>("/api/vendors", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Omit<Vendor, "id" | "createdAt">) =>
      request<Vendor>(`/api/vendors/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
  },
  batches: {
    list: () => request<BrokerBatch[]>("/api/batches"),
    create: (input: Omit<BrokerBatch, "id">) =>
      request<BrokerBatch>("/api/batches", {
        method: "POST",
        body: JSON.stringify(input),
      }),
  },
  sales: {
    list: () => request<Sale[]>("/api/distributions"),
    create: (input: Omit<Sale, "id" | "createdAt" | "updatedAt">) =>
      request<Sale>("/api/distributions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Omit<Sale, "id" | "createdAt" | "updatedAt">) =>
      request<Sale>(`/api/distributions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ id: string }>(`/api/distributions/${id}`, { method: "DELETE" }),
  },
  payments: {
    list: () => request<Payment[]>("/api/payments"),
    create: (input: PaymentInput) =>
      request<{ payment: Payment; sales: Sale[] }>("/api/payments", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ id: string; sales: Sale[] }>(`/api/payments/${id}`, { method: "DELETE" }),
  },
  activity: {
    list: (params: { role?: string; entity?: string; action?: string; before?: string } = {}) => {
      const q = new URLSearchParams(
        Object.entries(params).filter((e): e is [string, string] => Boolean(e[1])),
      ).toString();
      return request<ActivityPage>(`/api/activity${q ? `?${q}` : ""}`);
    },
  },
};
