"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@/src/lib/api";
import { useAppData } from "@/src/store/data-context";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/icons";
import { cn } from "@/src/utils/cn";
import { formatCurrency, formatDate } from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import type { ActivityAction, ActivityChange, ActivityEntity, ActivityEntry } from "@/src/types";

type RoleFilter = "accountant" | "admin" | "";
type ActionFilter = ActivityAction | "";

const ROLE_FILTERS: { value: RoleFilter; label: string }[] = [
  { value: "accountant", label: "Accounts staff" },
  { value: "admin", label: "Admins" },
  { value: "", label: "Everyone" },
];

const ACTION_FILTERS: { value: ActionFilter; label: string }[] = [
  { value: "", label: "All changes" },
  { value: "update", label: "Edited" },
  { value: "create", label: "Added" },
  { value: "delete", label: "Deleted" },
];

const ACTION_TEXT: Record<ActivityAction, { verb: string; tone: "info" | "success" | "danger" }> = {
  update: { verb: "edited", tone: "info" },
  create: { verb: "added", tone: "success" },
  delete: { verb: "deleted", tone: "danger" },
};

const ENTITY_TEXT: Record<ActivityEntity, string> = {
  sale: "a sale",
  customer: "a customer",
  payment: "a payment",
  kola_category: "a kola category",
  broker: "a broker",
  batch: "a stock batch",
};

/** Where the record can be opened, if it still exists. */
function recordHref(e: ActivityEntry): string | null {
  if (e.action === "delete") return null;
  switch (e.entity) {
    case "sale":
      return `/distributions/${e.entityId}`;
    case "customer":
      return `/vendors/${e.entityId}`;
    case "broker":
      return `/brokers/${e.entityId}`;
    case "payment":
      return "/payments";
    case "kola_category":
      return "/kola-categories";
    default:
      return null;
  }
}

const FIELD_LABELS: Record<string, string> = {
  vendorId: "Customer",
  batchId: "Stock batch",
  brokerId: "Broker",
  kayaTypes: "Kaya types",
  kayaItems: "Kaya items",
  qualityCategory: "Quality",
  kolaQuantity: "Kola quantity",
  totalWeight: "Net weight",
  thanduCount: "Thandu count",
  thanduWeight: "Thandu weight",
  rateBasis: "Rate basis",
  dailySellingRate: "Selling rate",
  grossTotal: "Gross total",
  discount: "Discount",
  netPayable: "Net payable",
  amountCollected: "Amount collected",
  balanceDue: "Balance due",
  paymentMethod: "Payment method",
  "paymentDetails.upiId": "UPI ID",
  "paymentDetails.upiTransactionId": "UPI transaction ID",
  "paymentDetails.bankName": "Bank name",
  "paymentDetails.accountHolderName": "Account holder",
  "paymentDetails.accountNumber": "Account number",
  "paymentDetails.ifscCode": "IFSC code",
  "paymentDetails.bankReference": "UTR / reference",
  customFields: "Custom fields",
  notes: "Notes",
  date: "Date",
  name: "Name",
  contactPerson: "Contact person",
  phone: "Phone",
  location: "Location",
  amount: "Amount",
  method: "Method",
  reference: "Reference",
  inwardQtyKolas: "Inward kolas",
  totalWeightKg: "Total weight",
  thanduPerKola: "Thandu per kola",
  ratePerKola: "Rate per kola",
  status: "Status",
};

const MONEY_FIELDS = new Set([
  "dailySellingRate",
  "grossTotal",
  "discount",
  "netPayable",
  "amountCollected",
  "balanceDue",
  "amount",
  "ratePerKola",
]);
const KG_FIELDS = new Set(["totalWeight", "thanduWeight", "totalWeightKg"]);

function fieldLabel(field: string) {
  return FIELD_LABELS[field] ?? field.replace(/^.*\./, "").replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());
}

function useValueFormatter() {
  const { data } = useAppData();
  const vendorNames = useMemo(() => new Map(data.vendors.map((v) => [v.id, v.name])), [data.vendors]);
  const brokerNames = useMemo(() => new Map(data.brokers.map((b) => [b.id, b.name])), [data.brokers]);

  return useCallback(
    (field: string, value: unknown): string => {
      if (value === null || value === undefined || value === "") return "—";
      if (Array.isArray(value) && value.length === 0) return "—";
      if (field === "vendorId") return vendorNames.get(String(value)) ?? "Removed customer";
      if (field === "brokerId") return brokerNames.get(String(value)) ?? "Removed broker";
      if (MONEY_FIELDS.has(field)) return formatCurrency(Number(value));
      if (KG_FIELDS.has(field)) return `${Number(value)} kg`;
      if (field === "date") return formatDate(String(value));
      if (field === "paymentMethod" || field === "method")
        return PAYMENT_METHODS.find((m) => m.value === value)?.label ?? String(value);
      if (field === "rateBasis") return value === "per_kg" ? "Per kg" : "Per kola";
      if (field === "kayaItems" && Array.isArray(value)) {
        return value
          .map((i: { kayaType?: string; kolaQuantity?: number; totalWeight?: number; sellingRate?: number }) => {
            const parts = [`${i.kolaQuantity ?? 0} kolas`];
            if (i.totalWeight !== undefined) parts.push(`${i.totalWeight} kg`);
            if (i.sellingRate !== undefined) parts.push(`@ ${formatCurrency(i.sellingRate)}`);
            return `${i.kayaType}: ${parts.join(", ")}`;
          })
          .join("; ");
      }
      if (field === "customFields" && Array.isArray(value)) {
        return value.map((c: { label?: string; value?: string }) => `${c.label || "Field"}: ${c.value || "—"}`).join("; ");
      }
      if (Array.isArray(value)) return value.join(", ");
      if (typeof value === "object") return JSON.stringify(value);
      return String(value);
    },
    [vendorNames, brokerNames],
  );
}

const timeFmt = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit" });

function dayHeading(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return formatDate(iso);
}

function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.label}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "h-9 cursor-pointer rounded-full border px-4 text-[13px] font-semibold transition",
            value === o.value
              ? "border-forest-700 bg-forest-800 text-white"
              : "border-sand-200 bg-white text-sand-700 hover:border-forest-300 hover:text-forest-700",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ChangesTable({ changes }: { changes: ActivityChange[] }) {
  const format = useValueFormatter();
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-sand-100">
      <table className="w-full min-w-[480px] text-left text-[13px]">
        <thead>
          <tr className="bg-sand-50 text-[11px] uppercase tracking-wide text-sand-400">
            <th className="px-3 py-2 font-semibold">Field</th>
            <th className="px-3 py-2 font-semibold">Before</th>
            <th className="px-3 py-2 font-semibold">After</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-sand-100">
          {changes.map((c) => (
            <tr key={c.field}>
              <td className="px-3 py-2 font-semibold text-sand-700">{fieldLabel(c.field)}</td>
              <td className="px-3 py-2 text-red-700 line-through decoration-red-300">{format(c.field, c.from)}</td>
              <td className="px-3 py-2 font-semibold text-emerald-700">{format(c.field, c.to)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const [open, setOpen] = useState(entry.action === "update");
  const { verb, tone } = ACTION_TEXT[entry.action];
  const href = recordHref(entry);
  const hasChanges = entry.changes.length > 0;

  return (
    <li className="px-5 py-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-banana-100 text-[13px] font-extrabold uppercase text-forest-900">
          {entry.userEmail[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-[14px] font-bold text-sand-900">{entry.userEmail}</span>
            <Badge tone={entry.userRole === "accountant" ? "banana" : "forest"}>
              {entry.userRole === "accountant" ? "Accounts" : "Admin"}
            </Badge>
            <span className="text-[14px] text-sand-600">
              {verb} {ENTITY_TEXT[entry.entity]}
            </span>
            <Badge tone={tone}>{verb[0].toUpperCase() + verb.slice(1)}</Badge>
          </div>
          <p className="mt-1 text-[14px] font-semibold text-sand-800">
            {entry.label || "—"}
            {entry.detail && <span className="font-normal text-sand-500"> · {entry.detail}</span>}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[12.5px]">
            <span className="inline-flex items-center gap-1 text-sand-500">
              <Icon.Clock className="h-3.5 w-3.5" />
              {timeFmt.format(new Date(entry.createdAt))}
            </span>
            {hasChanges && (
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="inline-flex cursor-pointer items-center gap-1 font-semibold text-forest-700 hover:underline"
              >
                {open ? "Hide" : "Show"} {entry.changes.length} {entry.changes.length === 1 ? "change" : "changes"}
                <Icon.ChevronDown className={cn("h-3.5 w-3.5 transition", open && "rotate-180")} />
              </button>
            )}
            {href && (
              <Link href={href} className="inline-flex items-center gap-1 font-semibold text-forest-700 hover:underline">
                Open record <Icon.ChevronRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
          {open && hasChanges && <ChangesTable changes={entry.changes} />}
        </div>
      </div>
    </li>
  );
}

export function ActivityLogScreen() {
  const [role, setRole] = useState<RoleFilter>("accountant");
  const [action, setAction] = useState<ActionFilter>("");
  const [items, setItems] = useState<ActivityEntry[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    api.activity
      .list({ role, action })
      .then((page) => {
        if (ignore) return;
        setItems(page.items);
        setHasMore(page.hasMore);
      })
      .catch((err: Error) => !ignore && setError(err.message))
      .finally(() => !ignore && setLoading(false));
    return () => {
      ignore = true;
    };
  }, [role, action]);

  // Switching a filter shows the skeleton until that filter's first page arrives.
  function changeRole(v: RoleFilter) {
    if (v === role) return;
    setLoading(true);
    setError(null);
    setRole(v);
  }
  function changeAction(v: ActionFilter) {
    if (v === action) return;
    setLoading(true);
    setError(null);
    setAction(v);
  }

  async function loadMore() {
    const last = items[items.length - 1];
    if (!last) return;
    setLoadingMore(true);
    try {
      const page = await api.activity.list({ role, action, before: last.createdAt });
      setItems((cur) => [...cur, ...page.items]);
      setHasMore(page.hasMore);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoadingMore(false);
    }
  }

  const groups = useMemo(() => {
    const out: { day: string; entries: ActivityEntry[] }[] = [];
    for (const e of items) {
      const day = dayHeading(e.createdAt);
      if (out.at(-1)?.day === day) out.at(-1)!.entries.push(e);
      else out.push({ day, entries: [e] });
    }
    return out;
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <FilterChips options={ROLE_FILTERS} value={role} onChange={changeRole} />
        <FilterChips options={ACTION_FILTERS} value={action} onChange={changeAction} />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[13.5px] font-semibold text-red-700">
          <Icon.AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {loading ? (
        <Card>
          <CardBody className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-sand-100" />
            ))}
          </CardBody>
        </Card>
      ) : items.length === 0 ? (
        <EmptyState
          icon={<Icon.Clock className="h-6 w-6" />}
          title="No activity yet"
          description={
            role === "accountant"
              ? "When accounts staff add, edit or delete sales, customers or payments, it will show up here."
              : "Changes to sales, customers and payments will show up here."
          }
        />
      ) : (
        <>
          {groups.map((g) => (
            <section key={g.day} className="space-y-2">
              <h2 className="px-1 text-[12px] font-bold uppercase tracking-wider text-sand-500">{g.day}</h2>
              <Card>
                <CardBody className="p-0">
                  <ul className="divide-y divide-sand-100">
                    {g.entries.map((e) => (
                      <ActivityRow key={e.id} entry={e} />
                    ))}
                  </ul>
                </CardBody>
              </Card>
            </section>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? "Loading…" : "Load older activity"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
