import type { Broker, BrokerBatch, Distribution, Vendor } from "@/src/types";

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

  const body = (await res.json()) as ApiSuccess<T> | ApiFailure;

  if (!res.ok || !body.success) {
    throw new Error(!body.success ? body.message : `Request to ${url} failed`);
  }

  return body.data;
}

export const api = {
  brokers: {
    list: () => request<Broker[]>("/api/brokers"),
    create: (input: Omit<Broker, "id" | "createdAt">) =>
      request<Broker>("/api/brokers", { method: "POST", body: JSON.stringify(input) }),
  },
  vendors: {
    list: () => request<Vendor[]>("/api/vendors"),
    create: (input: Omit<Vendor, "id" | "createdAt">) =>
      request<Vendor>("/api/vendors", { method: "POST", body: JSON.stringify(input) }),
  },
  batches: {
    list: () => request<BrokerBatch[]>("/api/batches"),
    create: (input: Omit<BrokerBatch, "id">) =>
      request<BrokerBatch>("/api/batches", { method: "POST", body: JSON.stringify(input) }),
  },
  distributions: {
    list: () => request<Distribution[]>("/api/distributions"),
    create: (input: Omit<Distribution, "id" | "createdAt" | "updatedAt">) =>
      request<Distribution>("/api/distributions", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Omit<Distribution, "id" | "createdAt" | "updatedAt">) =>
      request<Distribution>(`/api/distributions/${id}`, {
        method: "PUT",
        body: JSON.stringify(input),
      }),
    remove: (id: string) =>
      request<{ id: string }>(`/api/distributions/${id}`, { method: "DELETE" }),
  },
};
