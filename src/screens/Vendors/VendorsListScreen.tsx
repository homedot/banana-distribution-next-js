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

export function VendorsListScreen() {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const summaries = useMemo(() => {
    const all = getVendorSummaries(data).sort(
      (a, b) => b.totalPending - a.totalPending || b.totalNetPayable - a.totalNetPayable
    );
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (s) =>
        s.vendor.name.toLowerCase().includes(q) ||
        s.vendor.location.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <div className="space-y-5">
      <div className="relative w-full sm:max-w-xs">
        <Icon.Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-sand-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search vendor or shop…"
          className="h-11 w-full rounded-xl border border-sand-200 bg-white pl-10 pr-3.5 text-[14px] outline-none transition focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
        />
      </div>

      <Card>
        <CardBody className="p-0">
          {summaries.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Icon.Store className="h-6 w-6" />}
                title="No vendors found"
                description="New vendors can be added directly from the distribution wizard."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                    <th className="px-5 py-3 font-semibold">Vendor</th>
                    <th className="px-3 py-3 font-semibold">Location</th>
                    <th className="px-3 py-3 font-semibold text-right">Kolas</th>
                    <th className="px-3 py-3 font-semibold text-right">Net Payable</th>
                    <th className="px-3 py-3 font-semibold text-right">Collected</th>
                    <th className="px-3 py-3 font-semibold text-right">Pending</th>
                    <th className="px-3 py-3 font-semibold">Last Activity</th>
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
                      <td className="px-5 py-3 text-right">
                        <Link
                          href={`/vendors/${s.vendor.id}`}
                          className="inline-flex items-center gap-1 text-[12.5px] font-semibold text-forest-700 hover:underline"
                        >
                          View <Icon.ChevronRight className="h-3.5 w-3.5" />
                        </Link>
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
