"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { saleRefs, sortedSales } from "@/src/store/selectors";
import { paymentStatus } from "@/src/utils/calculations";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
} from "@/src/utils/format";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { DateRangeFilter } from "@/src/components/domain/DateRangeFilter";
import {
  ALL_TIME,
  inRange,
  isAllTime,
  rangePhrase,
  toDayKey,
  type PeriodRange,
} from "@/src/utils/period";
import type { PaymentStatus } from "@/src/types";

const FILTERS: { value: "all" | PaymentStatus; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
];

export function SalesListScreen() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | PaymentStatus>("all");
  // The applied From → To range (all time until the user presses Apply).
  const [range, setRange] = useState<PeriodRange>(ALL_TIME);
  const dateFiltered = !isAllTime(range);
  const phrase = rangePhrase(range);

  const list = useMemo(() => {
    const all = sortedSales(data);
    const q = query.trim().toLowerCase();
    return all.filter((d) => {
      const { vendor } = saleRefs(data, d);
      if (!inRange(toDayKey(d.date), range)) return false;
      if (filter !== "all" && paymentStatus(d) !== filter) return false;
      if (!q) return true;
      return (
        vendor?.name.toLowerCase().includes(q) ||
        d.kayaType.toLowerCase().includes(q)
      );
    });
  }, [data, query, filter, range]);

  const totals = list.reduce(
    (t, d) => ({
      billed: t.billed + d.netPayable,
      collected: t.collected + d.amountCollected,
      pending: t.pending + d.balanceDue,
      kolas: t.kolas + d.kolaQuantity,
    }),
    { billed: 0, collected: 0, pending: 0, kolas: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer or kaya type…"
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
        </div>
      </div>

      <DateRangeFilter value={range} onApply={setRange} />

      {dateFiltered && list.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sand-200/80 bg-white px-5 py-4 shadow-soft">
            <p className="text-[15px] font-bold text-sand-600">Sales {phrase}</p>
            <p className="mt-1 text-[26px] font-extrabold text-sand-900">
              {formatCurrency(totals.billed)}
            </p>
            <p className="text-[14px] font-semibold text-sand-500">
              {list.length} {list.length === 1 ? "sale" : "sales"} ·{" "}
              {formatNumber(totals.kolas)} kolas
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 px-5 py-4">
            <p className="text-[15px] font-bold text-emerald-800">Collected</p>
            <p className="mt-1 text-[26px] font-extrabold text-emerald-700">
              {formatCurrency(totals.collected)}
            </p>
          </div>
          <div className="rounded-2xl bg-red-50 px-5 py-4">
            <p className="text-[15px] font-bold text-red-800">Pending</p>
            <p className="mt-1 text-[26px] font-extrabold text-red-700">
              {formatCurrency(totals.pending)}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardBody className="p-0">
          {list.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Icon.Truck className="h-6 w-6" />}
                title={
                  dateFiltered && !query && filter === "all"
                    ? `No sales ${phrase}`
                    : "No Sales found"
                }
                description={
                  dateFiltered
                    ? "Nothing matches in this period. Try other dates, or press Clear to see all."
                    : "Try a different search, or create a new dispatch."
                }
                action={
                  <Link href="/distributions/new">
                    <Button size="sm">
                      <Icon.Plus className="h-3.5 w-3.5" /> New Sale
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
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Kaya</th>
                    <th className="px-3 py-3 font-semibold text-right">Qty</th>
                    <th className="px-3 py-3 font-semibold text-right">
                      Net Payable
                    </th>
                    <th className="px-3 py-3 font-semibold text-right">
                      Balance
                    </th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-3 py-3 font-semibold">Date</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {list.map((d) => {
                    const { vendor } = saleRefs(data, d);
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
                        <td className="px-3 py-3 font-medium text-sand-700">
                          {d.kayaType || "—"}
                        </td>
                        <td className="px-3 py-3 text-right font-medium text-sand-700">
                          {formatNumber(d.kolaQuantity)} kolas
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-sand-900">
                          {formatCurrency(d.netPayable)}
                        </td>
                        <td className="px-3 py-3 text-right font-semibold text-red-600">
                          {d.balanceDue > 0
                            ? formatCurrency(d.balanceDue)
                            : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <PaymentStatusBadge sale={d} />
                        </td>
                        <td className="px-3 py-3 text-sand-500">
                          {formatDate(d.date)}
                        </td>
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
