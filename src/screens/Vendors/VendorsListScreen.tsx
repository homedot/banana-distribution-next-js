"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { getVendorSummaries } from "@/src/store/selectors";
import { formatCurrency, formatDate, formatNumber, initials } from "@/src/utils/format";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Icon } from "@/src/components/icons";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Button } from "@/src/components/ui/Button";
import { VendorFormModal } from "@/src/components/domain/AddVendorModal";
import type { Vendor } from "@/src/types";
import { DateRangeFilter } from "@/src/components/domain/DateRangeFilter";
import {
  ALL_TIME,
  inRange,
  isAllTime,
  rangePhrase,
  rangeQuery,
  toDayKey,
  type PeriodRange,
} from "@/src/utils/period";

export function VendorsListScreen() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Vendor | null>(null);
  // The applied From → To range (all time until the user presses Apply).
  const [range, setRange] = useState<PeriodRange>(ALL_TIME);
  const filtered = !isAllTime(range);
  const phrase = rangePhrase(range);

  const summaries = useMemo(() => {
    const sales = data.sales.filter((d) => inRange(toDayKey(d.date), range));
    const all = getVendorSummaries({ ...data, sales })
      // With a date range, list only vendors who bought something in it.
      .filter((s) => !filtered || s.sales.length > 0)
      .sort(
      (a, b) => b.totalPending - a.totalPending || b.totalNetPayable - a.totalNetPayable
    );
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.vendor.name.toLowerCase().includes(q) ||
        s.vendor.location.toLowerCase().includes(q)
    );
  }, [data, query, range, filtered]);

  const totals = summaries.reduce(
    (t, s) => ({
      billed: t.billed + s.totalNetPayable,
      collected: t.collected + s.totalCollected,
      pending: t.pending + s.totalPending,
    }),
    { billed: 0, collected: 0, pending: 0 },
  );

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search customer or shop…"
            className="h-11 w-full rounded-xl border border-sand-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
          />
        </div>
        <Button size="lg" onClick={() => setAddOpen(true)}>
          <Icon.UserPlus className="h-[18px] w-[18px]" />
          Add Customer
        </Button>
      </div>

      <VendorFormModal open={addOpen} onClose={() => setAddOpen(false)} />
      <VendorFormModal
        open={editing !== null}
        vendor={editing}
        onClose={() => setEditing(null)}
      />

      <DateRangeFilter value={range} onApply={setRange} />

      {filtered && summaries.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-sand-200/80 bg-white px-5 py-4 shadow-soft">
            <p className="text-[15px] font-bold text-sand-600">Billed {phrase}</p>
            <p className="mt-1 text-[26px] font-extrabold text-sand-900">
              {formatCurrency(totals.billed)}
            </p>
            <p className="text-[14px] font-semibold text-sand-500">
              {summaries.length} {summaries.length === 1 ? "customer" : "customers"}
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
          {summaries.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Icon.Store className="h-6 w-6" />}
                title={filtered && !query ? `No sales ${phrase}` : "No customers found"}
                description={
                  query
                    ? "No customers match your search."
                    : filtered
                      ? "No customer bought anything in this period. Try other dates, or press Clear to see all."
                      : "Click Add Customer to register your first shopkeeper."
                }
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                    <th className="px-5 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Location</th>
                    <th className="px-3 py-3 font-semibold text-right">Kolas</th>
                    <th className="px-3 py-3 font-semibold text-right">Net Payable</th>
                    <th className="px-3 py-3 font-semibold text-right">Collected</th>
                    <th className="px-3 py-3 font-semibold text-right">Pending</th>
                    <th className="px-3 py-3 font-semibold">{filtered ? "Last Sale" : "Last Activity"}</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {summaries.map((s) => (
                    <tr key={s.vendor.id} className="transition hover:bg-sand-50/70">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-[10px] font-bold text-forest-700">
                            {initials(s.vendor.name)}
                          </span>
                          <span className="font-semibold text-sand-900">{s.vendor.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sand-600">{s.vendor.location}</td>
                      <td className="px-3 py-3 text-right text-sand-700">
                        {formatNumber(s.totalKolas)}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-sand-900">
                        {formatCurrency(s.totalNetPayable)}
                      </td>
                      <td className="px-3 py-3 text-right text-emerald-700">
                        {formatCurrency(s.totalCollected)}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {s.totalPending > 0 ? (
                          <Badge tone="danger">{formatCurrency(s.totalPending)}</Badge>
                        ) : (
                          <Badge tone="success">Settled</Badge>
                        )}
                      </td>
                      <td className="px-3 py-3 text-sand-500">
                        {s.lastActivity ? formatDate(s.lastActivity) : "—"}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setEditing(s.vendor)}
                            aria-label={`Edit ${s.vendor.name}`}
                            title="Edit customer"
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-sand-500 transition cursor-pointer hover:bg-forest-50 hover:text-forest-700"
                          >
                            <Icon.Edit className="h-4 w-4" />
                          </button>
                          <Link
                            href={`/vendors/${s.vendor.id}${rangeQuery(range)}`}
                            className="ml-1 inline-flex items-center gap-1 text-[12.5px] font-semibold text-forest-700 hover:underline"
                          >
                            View <Icon.ChevronRight className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
