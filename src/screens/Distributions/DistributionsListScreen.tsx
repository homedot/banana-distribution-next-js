"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { distributionRefs, sortedDistributions } from "@/src/store/selectors";
import { paymentStatus } from "@/src/utils/calculations";
import { formatCurrency, formatDate, formatNumber, initials } from "@/src/utils/format";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import type { PaymentStatus } from "@/src/types";

const FILTERS: { value: "all" | PaymentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export function DistributionsListScreen() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");

  const list = useMemo(() => {
    const all = sortedDistributions(data);
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      const { vendor, broker } = distributionRefs(data, d);
      if (filter !== "all" && paymentStatus(d) !== filter) return false;
      if (!q) return true;
      return (
        vendor?.name.toLowerCase().includes(q) ||
        broker?.name.toLowerCase().includes(q) ||
        d.kayaType.toLowerCase().includes(q)
      );
    });
  }, [data, query, filter]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search vendor, broker, kaya type…"
            className="h-11 w-full rounded-xl border border-sand-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
          />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-sand-200 bg-white p-1">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-lg px-3 py-1.5 text-[12.5px] font-semibold transition cursor-pointer ${
                  filter === f.value
                    ? "bg-forest-800 text-white"
                    : "text-sand-500 hover:text-sand-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <Link href="/distributions/new">
            <Button size="md">
              <Icon.Plus className="h-4 w-4" /> New
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardBody className="p-0">
          {list.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Icon.Truck className="h-6 w-6" />}
                title="No distributions found"
                description="Try a different search, or create a new dispatch."
                action={
                  <Link href="/distributions/new">
                    <Button size="sm">
                      <Icon.Plus className="h-3.5 w-3.5" /> New Distribution
                    </Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                    <th className="px-5 py-3 font-semibold">Vendor</th>
                    <th className="px-3 py-3 font-semibold">Broker / Kaya</th>
                    <th className="px-3 py-3 font-semibold text-right">Qty</th>
                    <th className="px-3 py-3 font-semibold text-right">Net Payable</th>
                    <th className="px-3 py-3 font-semibold text-right">Balance</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {list.map((d) => {
                    const { vendor, broker } = distributionRefs(data, d);
                    return (
                      <tr key={d.id} className="transition hover:bg-sand-50/70">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-[10px] font-bold text-forest-700">
                              {initials(vendor?.name ?? "?")}
                            </span>
                            <span className="font-semibold text-sand-900">
                              {vendor?.name ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-sand-600">
                          <p className="font-medium text-sand-700">{broker?.name ?? "—"}</p>
                          <p className="text-[11.5px] text-sand-400">{d.kayaType}</p>
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-sand-700">
                          {formatNumber(d.kolaQuantity)} kolas
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-sand-900">
                          {formatCurrency(d.netPayable)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-red-600">
                          {d.balanceDue > 0 ? formatCurrency(d.balanceDue) : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <PaymentStatusBadge distribution={d} />
                        </td>
                        <td className="px-3 py-3 text-sand-500">{formatDate(d.date)}</td>
                        <td className="px-5 py-3 text-right">
                          <Link href={`/distributions/${d.id}`}>
                            <Button variant="ghost" size="sm">
                              View <Icon.ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
