"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useAppData } from "@/src/store/data-context";
import {
  distributionRefs,
  getBrokerSummaries,
  getDashboardStats,
  getVendorSummaries,
  sortedDistributions,
} from "@/src/store/selectors";
import { StatCard } from "@/src/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { BarChart } from "@/src/components/charts/BarChart";
import { DonutChart } from "@/src/components/charts/DonutChart";
import { formatCurrency, formatDateShort, formatNumber, initials } from "@/src/utils/format";

export function DashboardScreen() {
  const { data } = useAppData();
  const stats = useMemo(() => getDashboardStats(data), [data]);
  const recent = useMemo(() => sortedDistributions(data).slice(0, 6), [data]);
  const brokerSummaries = useMemo(() => getBrokerSummaries(data), [data]);
  const vendorSummaries = useMemo(() => getVendorSummaries(data), [data]);

  const dailyWeights = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data.distributions) {
      const day = d.date.slice(0, 10);
      map.set(day, (map.get(day) ?? 0) + d.totalWeight);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-7)
      .map(([day, weight]) => ({
        label: formatDateShort(day),
        value: Math.round(weight),
      }));
  }, [data.distributions]);

  const kayaBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data.distributions) {
      map.set(d.kayaType, (map.get(d.kayaType) ?? 0) + d.kolaQuantity);
    }
    return Array.from(map.entries()).map(([label, value]) => ({ label, value }));
  }, [data.distributions]);

  const topPendingVendors = useMemo(
    () =>
      [...vendorSummaries]
        .filter((v) => v.totalPending > 0)
        .sort((a, b) => b.totalPending - a.totalPending)
        .slice(0, 5),
    [vendorSummaries]
  );

  const collectionRate =
    stats.totalNetPayable > 0
      ? (stats.totalCollected / stats.totalNetPayable) * 100
      : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Distributions"
          value={formatNumber(stats.totalDistributions)}
          icon={<Icon.Truck className="h-5 w-5" />}
          tone="forest"
          trend={`${stats.activeVendors} vendors`}
          trendTone="neutral"
        />
        <StatCard
          label="Bananas Distributed"
          value={`${formatNumber(stats.totalKolas)} kolas`}
          icon={<Icon.Banana className="h-5 w-5" />}
          tone="banana"
          trend={`${formatNumber(stats.totalWeightKg)} kg`}
          trendTone="neutral"
        />
        <StatCard
          label="Pending Distributions"
          value={formatNumber(stats.pendingCount)}
          icon={<Icon.Clock className="h-5 w-5" />}
          tone="danger"
          trend={formatCurrency(stats.totalPending)}
          trendTone="down"
        />
        <StatCard
          label="Completed Distributions"
          value={formatNumber(stats.completedCount)}
          icon={<Icon.Check className="h-5 w-5" />}
          tone="info"
          trend={`${Math.round(collectionRate)}% collected`}
          trendTone="up"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Dispatch Weight — Last 7 Active Days</CardTitle>
            <Badge tone="banana">kg / day</Badge>
          </CardHeader>
          <CardBody>
            <BarChart
              data={dailyWeights}
              valueFormatter={(v) => `${formatNumber(v)} kg`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock by Kaya Type</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={kayaBreakdown} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Recent Distribution Activity</CardTitle>
            <Link href="/distributions">
              <Button variant="ghost" size="sm">
                View all <Icon.ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardBody className="pt-3">
            {recent.length === 0 ? (
              <EmptyState
                icon={<Icon.Truck className="h-6 w-6" />}
                title="No distributions yet"
                description="Create your first dispatch to see activity here."
              />
            ) : (
              <ul className="divide-y divide-sand-100">
                {recent.map((d) => {
                  const { vendor, broker } = distributionRefs(data, d);
                  return (
                    <li key={d.id}>
                      <Link
                        href={`/distributions/${d.id}`}
                        className="flex items-center justify-between gap-3 py-3 transition hover:opacity-80"
                      >
                        <div className="flex items-center gap-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-forest-50 text-[11px] font-bold text-forest-700">
                            {initials(vendor?.name ?? "?")}
                          </span>
                          <div>
                            <p className="text-[13.5px] font-semibold text-sand-900">
                              {vendor?.name ?? "Unknown vendor"}
                            </p>
                            <p className="text-[11.5px] text-sand-500">
                              {d.kayaType} · {formatNumber(d.kolaQuantity)} kolas ·{" "}
                              {broker?.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13.5px] font-bold text-sand-900">
                            {formatCurrency(d.netPayable)}
                          </p>
                          <PaymentStatusBadge distribution={d} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Vendors to Follow Up</CardTitle>
          </CardHeader>
          <CardBody className="pt-3">
            {topPendingVendors.length === 0 ? (
              <EmptyState
                icon={<Icon.Check className="h-6 w-6" />}
                title="All settled"
                description="No pending vendor balances right now."
              />
            ) : (
              <ul className="space-y-3.5">
                {topPendingVendors.map((v) => (
                  <li key={v.vendor.id}>
                    <Link
                      href={`/vendors/${v.vendor.id}`}
                      className="block rounded-xl p-1 transition hover:bg-sand-50"
                    >
                      <div className="flex items-center justify-between text-[13px]">
                        <span className="font-semibold text-sand-800">
                          {v.vendor.name}
                        </span>
                        <span className="font-bold text-red-600">
                          {formatCurrency(v.totalPending)}
                        </span>
                      </div>
                      <ProgressBar
                        className="mt-1.5"
                        tone="banana"
                        value={
                          v.totalNetPayable > 0
                            ? (v.totalCollected / v.totalNetPayable) * 100
                            : 0
                        }
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broker Consignment Overview</CardTitle>
          <Link href="/brokers">
            <Button variant="ghost" size="sm">
              Manage brokers <Icon.ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardBody className="overflow-x-auto pt-3">
          <table className="w-full min-w-[640px] text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-sand-400">
                <th className="pb-2 font-semibold">Broker</th>
                <th className="pb-2 font-semibold">Kaya Type</th>
                <th className="pb-2 font-semibold text-right">Inward</th>
                <th className="pb-2 font-semibold text-right">Dispatched</th>
                <th className="pb-2 font-semibold text-right">Remaining</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {brokerSummaries.map((s) => (
                <tr key={s.broker.id}>
                  <td className="py-2.5">
                    <Link
                      href={`/brokers/${s.broker.id}`}
                      className="font-semibold text-forest-700 hover:underline"
                    >
                      {s.broker.name}
                    </Link>
                    <p className="text-[11.5px] text-sand-400">{s.broker.location}</p>
                  </td>
                  <td className="py-2.5 text-sand-600">
                    {s.batches[0]?.batch.kayaType ?? "—"}
                  </td>
                  <td className="py-2.5 text-right font-medium text-sand-700">
                    {formatNumber(s.inwardKolas)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-sand-700">
                    {formatNumber(s.dispatchedKolas)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={s.remainingKolas === 0 ? "neutral" : "banana"}>
                      {s.remainingKolas === 0 ? "Closed" : `${formatNumber(s.remainingKolas)} kolas`}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardBody>
      </Card>
    </div>
  );
}
