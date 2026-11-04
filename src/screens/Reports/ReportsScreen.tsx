"use client";

import { useMemo } from "react";
import { useAppData } from "@/src/store/data-context";
import { getBrokerSummaries, getDashboardStats, getVendorSummaries } from "@/src/store/selectors";
import { paymentStatus } from "@/src/utils/calculations";
import { formatCurrency, formatNumber } from "@/src/utils/format";
import { Colors } from "@/src/utils/colors";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { StatCard } from "@/src/components/ui/StatCard";
import { Icon } from "@/src/components/icons";
import { Badge } from "@/src/components/ui/Badge";
import { BarChart } from "@/src/components/charts/BarChart";
import { DonutChart } from "@/src/components/charts/DonutChart";
import { SERVICE_AREAS } from "@/src/utils/constants";

export function ReportsScreen() {
  const { data } = useAppData();
  const stats = useMemo(() => getDashboardStats(data), [data]);
  const brokerSummaries = useMemo(() => getBrokerSummaries(data), [data]);
  const vendorSummaries = useMemo(() => getVendorSummaries(data), [data]);

  const statusBreakdown = useMemo(() => {
    let paid = 0;
    let partial = 0;
    let pending = 0;
    for (const d of data.distributions) {
      const s = paymentStatus(d);
      if (s === "paid") paid += 1;
      else if (s === "partial") partial += 1;
      else pending += 1;
    }
    return [
      { label: "Paid", value: paid, color: Colors.success.text },
      { label: "Partial", value: partial, color: Colors.warning.text },
      { label: "Pending", value: pending, color: Colors.danger.text },
    ].filter((d) => d.value > 0);
  }, [data.distributions]);

  const kayaRevenue = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data.distributions) {
      map.set(d.kayaType, (map.get(d.kayaType) ?? 0) + d.netPayable);
    }
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value: Math.round(value) }));
  }, [data.distributions]);

  const areaBreakdown = useMemo(() => {
    return SERVICE_AREAS.map((area) => {
      const vendorIds = new Set(
        data.vendors.filter((v) => v.location === area).map((v) => v.id)
      );
      const items = data.distributions.filter((d) => vendorIds.has(d.vendorId));
      return {
        area,
        count: items.length,
        kolas: items.reduce((s, d) => s + d.kolaQuantity, 0),
        revenue: items.reduce((s, d) => s + d.netPayable, 0),
        pending: items.reduce((s, d) => s + d.balanceDue, 0),
      };
    });
  }, [data.distributions, data.vendors]);

  const topVendors = useMemo(
    () => [...vendorSummaries].sort((a, b) => b.totalNetPayable - a.totalNetPayable).slice(0, 5),
    [vendorSummaries]
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Revenue (Net Payable)"
          value={formatCurrency(stats.totalNetPayable)}
          icon={<Icon.Wallet className="h-5 w-5" />}
          tone="forest"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(stats.totalCollected)}
          icon={<Icon.TrendingUp className="h-5 w-5" />}
          tone="banana"
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(stats.totalPending)}
          icon={<Icon.Clock className="h-5 w-5" />}
          tone="danger"
        />
        <StatCard
          label="Avg. Dispatch Value"
          value={formatCurrency(
            stats.totalDistributions > 0 ? stats.totalNetPayable / stats.totalDistributions : 0
          )}
          icon={<Icon.Chart className="h-5 w-5" />}
          tone="info"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Revenue by Kaya Type</CardTitle>
          </CardHeader>
          <CardBody>
            <BarChart data={kayaRevenue} valueFormatter={(v) => formatCurrency(v)} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Distributions by Status</CardTitle>
          </CardHeader>
          <CardBody>
            <DonutChart data={statusBreakdown} />
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Service Area Performance</CardTitle>
          </CardHeader>
          <CardBody className="pt-2">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                  <th className="py-2 font-semibold">Area</th>
                  <th className="py-2 font-semibold text-right">Dispatches</th>
                  <th className="py-2 font-semibold text-right">Kolas</th>
                  <th className="py-2 font-semibold text-right">Revenue</th>
                  <th className="py-2 font-semibold text-right">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand-100">
                {areaBreakdown.map((a) => (
                  <tr key={a.area}>
                    <td className="py-2.5 font-semibold text-sand-900">{a.area}</td>
                    <td className="py-2.5 text-right text-sand-700">{a.count}</td>
                    <td className="py-2.5 text-right text-sand-700">
                      {formatNumber(a.kolas)}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-sand-900">
                      {formatCurrency(a.revenue)}
                    </td>
                    <td className="py-2.5 text-right">
                      {a.pending > 0 ? (
                        <Badge tone="danger">{formatCurrency(a.pending)}</Badge>
                      ) : (
                        <Badge tone="success">Settled</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Vendors by Value</CardTitle>
          </CardHeader>
          <CardBody className="pt-2">
            <ul className="space-y-3">
              {topVendors.map((v, i) => (
                <li key={v.vendor.id} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-100 text-[11px] font-bold text-sand-600">
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-[13px] font-semibold text-sand-900">{v.vendor.name}</p>
                    <p className="text-[11px] text-sand-400">{v.vendor.location}</p>
                  </div>
                  <span className="text-[13px] font-bold text-sand-900">
                    {formatCurrency(v.totalNetPayable)}
                  </span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Broker Performance</CardTitle>
        </CardHeader>
        <CardBody className="overflow-x-auto pt-2">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                <th className="py-2 font-semibold">Broker</th>
                <th className="py-2 font-semibold text-right">Inward</th>
                <th className="py-2 font-semibold text-right">Dispatched</th>
                <th className="py-2 font-semibold text-right">Remaining</th>
                <th className="py-2 font-semibold text-right">Collected</th>
                <th className="py-2 font-semibold text-right">Pending</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {brokerSummaries.map((s) => (
                <tr key={s.broker.id}>
                  <td className="py-2.5">
                    <p className="font-semibold text-sand-900">{s.broker.name}</p>
                    <p className="text-[11px] text-sand-400">{s.broker.location}</p>
                  </td>
                  <td className="py-2.5 text-right text-sand-700">
                    {formatNumber(s.inwardKolas)}
                  </td>
                  <td className="py-2.5 text-right text-sand-700">
                    {formatNumber(s.dispatchedKolas)}
                  </td>
                  <td className="py-2.5 text-right text-sand-700">
                    {formatNumber(s.remainingKolas)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-emerald-700">
                    {formatCurrency(s.totalCollected)}
                  </td>
                  <td className="py-2.5 text-right font-semibold text-red-600">
                    {formatCurrency(s.totalPending)}
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
