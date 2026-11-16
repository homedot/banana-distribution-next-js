"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import {
  saleRefs,
  getBrokerSummaries,
  getDashboardStats,
  getVendorSummaries,
  sortedSales,
} from "@/src/store/selectors";
import { StatCard } from "@/src/components/ui/StatCard";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { AreaChart } from "@/src/components/charts/AreaChart";
import { Colors } from "@/src/utils/colors";
import { DonutChart } from "@/src/components/charts/DonutChart";
import { formatCurrency, formatNumber, initials } from "@/src/utils/format";
import {
  chartBuckets,
  inRange,
  periodLabel,
  periodPhrase,
  periodRange,
  toDayKey,
  type Period,
} from "@/src/utils/period";
import { PeriodFilter } from "@/src/components/domain/PeriodFilter";
import type { Sale } from "@/src/types";

export function DashboardScreen() {
  const { data, loading } = useAppData();
  // "All Time" by default, so the dashboard opens the way it always has.
  // No anchor date yet: "All Time" doesn't need one, and reading today's date
  // during render would freeze it at prerender time. PeriodFilter sets the
  // anchor to today (in its click handler) when Day / Week / Month is chosen.
  const [{ period, anchor }, setFilter] = useState<{ period: Period; anchor: string }>({
    period: "all",
    anchor: "",
  });

  // Sales dated inside the selected day / week / month.
  const sales = useMemo(() => {
    const range = periodRange(period, anchor);
    return data.sales.filter((d) => inRange(toDayKey(d.date), range));
  }, [data.sales, period, anchor]);
  const phrase = periodPhrase(period, anchor);

  const stats = useMemo(() => getDashboardStats({ ...data, sales }), [data, sales]);
  const recent = useMemo(() => sortedSales({ ...data, sales }).slice(0, 6), [data, sales]);
  const brokerSummaries = useMemo(() => getBrokerSummaries(data), [data]);
  const vendorSummaries = useMemo(() => getVendorSummaries(data), [data]);

  const chart = useMemo(() => {
    const keyed = data.sales
      .map((d) => ({ d, key: toDayKey(d.date) }))
      .filter((x): x is { d: Sale; key: string } => x.key !== null);
    const buckets = chartBuckets(
      period,
      anchor,
      keyed.map((x) => x.key),
    );
    const sums = buckets.map((b) => {
      const cur = { weight: 0, billed: 0, collected: 0 };
      for (const { d, key } of keyed) {
        if (key < b.start || key > b.end) continue;
        cur.weight += num(d.totalWeight);
        cur.billed += num(d.netPayable);
        cur.collected += num(d.amountCollected);
      }
      return cur;
    });
    return {
      labels: buckets.map((b) => b.label),
      weight: sums.map((v) => Math.round(v.weight)),
      billed: sums.map((v) => Math.round(v.billed)),
      collected: sums.map((v) => Math.round(v.collected)),
    };
  }, [data.sales, period, anchor]);

  const chartSubtitle =
    period === "all"
      ? "Month by month"
      : period === "day"
        ? `7 days up to ${periodLabel("day", anchor)}`
        : `Day by day · ${periodLabel(period, anchor)}`;
  const chartWeight = chart.weight.reduce((a, b) => a + b, 0);
  const chartBilled = chart.billed.reduce((a, b) => a + b, 0);
  const chartCollected = chart.collected.reduce((a, b) => a + b, 0);

  const kayaBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of sales) {
      if (!d.kayaType) continue;
      map.set(d.kayaType, (map.get(d.kayaType) ?? 0) + num(d.kolaQuantity));
    }
    return Array.from(map.entries()).map(([label, value]) => ({
      label,
      value,
    }));
  }, [sales]);

  const topPendingVendors = useMemo(
    () =>
      [...vendorSummaries]
        .filter((v) => v.totalPending > 0)
        .sort((a, b) => b.totalPending - a.totalPending)
        .slice(0, 5),
    [vendorSummaries]
  );

  const collectionRate =
    stats.totalNetPayable > 0 ? (stats.totalCollected / stats.totalNetPayable) * 100 : 0;

  return (
    <div className="space-y-6">
      <PeriodFilter period={period} anchor={anchor} onChange={setFilter} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Sales"
          value={formatNumber(stats.totalSales)}
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
          label="Pending Sales"
          value={formatNumber(stats.pendingCount)}
          icon={<Icon.Clock className="h-5 w-5" />}
          tone="danger"
          amount={{ label: "Amount Pending", value: formatCurrency(stats.totalPending), tone: "danger" }}
        />
        <StatCard
          label="Completed Sales"
          value={formatNumber(stats.completedCount)}
          icon={<Icon.Check className="h-5 w-5" />}
          tone="info"
          trend={`${Math.round(collectionRate)}% collected`}
          trendTone="up"
          amount={{
            label: "Amount Collected",
            value: formatCurrency(stats.totalCollected),
            note: `of ${formatCurrency(stats.totalNetPayable)} billed`,
            tone: "success",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <Card>
          <CardHeader className="items-start">
            <div>
              <CardTitle>Dispatch Weight</CardTitle>
              <p className="mt-0.5 text-[12px] text-sand-500">{chartSubtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[20px] font-extrabold leading-tight text-sand-900">
                {formatNumber(chartWeight)}{" "}
                <span className="text-[13px] font-semibold text-sand-500">kg</span>
              </p>
              <Badge tone="banana">{period === "all" ? "kg / month" : "kg / day"}</Badge>
            </div>
          </CardHeader>
          <CardBody>
            <AreaChart
              labels={chart.labels}
              series={[
                {
                  key: "weight",
                  label: "Weight",
                  color: Colors.banana[600],
                  values: chart.weight,
                },
              ]}
              loading={loading}
              valueFormatter={(v) => `${formatNumber(v)} kg`}
              axisFormatter={(v) => formatCompact(v)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="items-start">
            <div>
              <CardTitle>Billed vs Collected</CardTitle>
              <p className="mt-0.5 text-[12px] text-sand-500">{chartSubtitle}</p>
            </div>
            <div className="text-right">
              <p className="text-[20px] font-extrabold leading-tight text-sand-900">
                {formatCurrency(chartCollected)}
              </p>
              <p className="text-[12px] text-sand-500">of {formatCurrency(chartBilled)} billed</p>
            </div>
          </CardHeader>
          <CardBody>
            <AreaChart
              labels={chart.labels}
              series={[
                {
                  key: "billed",
                  label: "Billed",
                  color: Colors.banana[600],
                  values: chart.billed,
                },
                {
                  key: "collected",
                  label: "Collected",
                  color: Colors.forest[600],
                  values: chart.collected,
                },
              ]}
              height={216}
              loading={loading}
              valueFormatter={(v) => formatCurrency(v)}
              axisFormatter={(v) => "₹" + formatCompact(v)}
            />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <div>
              <CardTitle>{period === "all" ? "Recent Sale Activity" : "Sale Activity"}</CardTitle>
              {period !== "all" && (
                <p className="mt-0.5 text-[12px] text-sand-500">
                  Latest sales {phrase}
                </p>
              )}
            </div>
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
                title={period === "all" ? "No Sales yet" : `No sales ${phrase}`}
                description={
                  period === "all"
                    ? "Create your first dispatch to see activity here."
                    : "Try another day, week or month, or choose All Time."
                }
              />
            ) : (
              <ul className="divide-y divide-sand-100">
                {recent.map((d) => {
                  const { vendor, broker } = saleRefs(data, d);
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
                              {d.kayaType} · {formatNumber(d.kolaQuantity)} kolas
                              {broker ? ` · ${broker.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[13.5px] font-bold text-sand-900">
                            {formatCurrency(d.netPayable)}
                          </p>
                          <PaymentStatusBadge sale={d} />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Stock by Kaya Type</CardTitle>
                <p className="mt-0.5 text-[12px] text-sand-500">Kolas sold {phrase}</p>
              </div>
            </CardHeader>
            <CardBody>
              <DonutChart data={kayaBreakdown} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Vendors to Follow Up</CardTitle>
                <p className="mt-0.5 text-[12px] text-sand-500">Current balances · all time</p>
              </div>
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
                          <span className="font-semibold text-sand-800">{v.vendor.name}</span>
                          <span className="font-bold text-red-600">
                            {formatCurrency(v.totalPending)}
                          </span>
                        </div>
                        <ProgressBar
                          className="mt-1.5"
                          tone="banana"
                          value={
                            v.totalNetPayable > 0 ? (v.totalCollected / v.totalNetPayable) * 100 : 0
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
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Broker Consignment Overview</CardTitle>
            <p className="mt-0.5 text-[12px] text-sand-500">All time</p>
          </div>
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
                  <td className="py-2.5 text-sand-600">{s.batches[0]?.batch.kayaType ?? "—"}</td>
                  <td className="py-2.5 text-right font-medium text-sand-700">
                    {formatNumber(s.inwardKolas)}
                  </td>
                  <td className="py-2.5 text-right font-medium text-sand-700">
                    {formatNumber(s.dispatchedKolas)}
                  </td>
                  <td className="py-2.5 text-right">
                    <Badge tone={s.remainingKolas === 0 ? "neutral" : "banana"}>
                      {s.remainingKolas === 0
                        ? "Closed"
                        : `${formatNumber(s.remainingKolas)} kolas`}
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

function formatCompact(v: number) {
  if (v >= 100000) return `${+(v / 100000).toFixed(1)}L`;
  if (v >= 1000) return `${+(v / 1000).toFixed(1)}k`;
  return String(Math.round(v));
}

function num(v: unknown) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
