"use client";

import Link from "next/link";
import { useAppData } from "@/src/store/data-context";
import { getBrokerSummary } from "@/src/store/selectors";
import { formatCurrency, formatDate, formatNumber } from "@/src/utils/format";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Icon } from "@/src/components/icons";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Button } from "@/src/components/ui/Button";

export function BrokerDetailScreen({ id }: { id: string }) {
  const { data } = useAppData();
  const summary = getBrokerSummary(data, id);

  if (!summary) {
    return (
      <EmptyState
        icon={<Icon.AlertCircle className="h-6 w-6" />}
        title="Broker not found"
        action={
          <Link href="/brokers">
            <Button size="sm">Back to Brokers</Button>
          </Link>
        }
      />
    );
  }

  const { broker, batches, inwardKolas, dispatchedKolas, remainingKolas, totalCollected, totalPending } = summary;

  return (
    <div className="space-y-5">
      <Link
        href="/brokers"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
      >
        <Icon.ArrowLeft className="h-4 w-4" /> Back to brokers
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-banana-100 text-[15px] font-extrabold text-banana-700">
            {broker.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-[20px] font-extrabold text-sand-900">{broker.name}</h2>
            <p className="flex items-center gap-1.5 text-[12.5px] text-sand-500">
              <Icon.MapPin className="h-3.5 w-3.5" /> {broker.location} ·{" "}
              <Icon.Phone className="h-3.5 w-3.5" /> {broker.phone}
            </p>
          </div>
        </div>
        <Badge tone={remainingKolas > 0 ? "banana" : "neutral"}>
          {remainingKolas > 0 ? `${formatNumber(remainingKolas)} kolas active` : "Fully dispatched"}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardBody className="text-center">
            <p className="text-[18px] font-extrabold text-sand-900">
              {formatNumber(inwardKolas)}
            </p>
            <p className="text-[11px] font-medium text-sand-400">Inward Kolas</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-[18px] font-extrabold text-sand-900">
              {formatNumber(dispatchedKolas)}
            </p>
            <p className="text-[11px] font-medium text-sand-400">Dispatched</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-[18px] font-extrabold text-emerald-700">
              {formatCurrency(totalCollected)}
            </p>
            <p className="text-[11px] font-medium text-sand-400">Collected</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-[18px] font-extrabold text-red-600">
              {formatCurrency(totalPending)}
            </p>
            <p className="text-[11px] font-medium text-sand-400">Pending</p>
          </CardBody>
        </Card>
      </div>

      <div className="space-y-5">
        {batches.map(({ batch, dispatchedKolas: batchDispatched, remainingKolas: batchRemaining, distributions }) => {
          const pct = batch.inwardQtyKolas > 0 ? (batchDispatched / batch.inwardQtyKolas) * 100 : 0;
          return (
            <Card key={batch.id}>
              <CardHeader>
                <div>
                  <CardTitle>
                    {batch.kayaType} · {formatDate(batch.date)}
                  </CardTitle>
                  <p className="mt-1 text-[12px] text-sand-500">
                    {formatNumber(batch.inwardQtyKolas)} kolas · {formatNumber(batch.totalWeightKg)} kg ·{" "}
                    {batch.thanduPerKola} thandu/kola · bought at {formatCurrency(batch.ratePerKola)}/kola
                  </p>
                </div>
                <Badge tone={batchRemaining === 0 ? "neutral" : "banana"}>
                  {batchRemaining === 0 ? "Closed" : `${formatNumber(batchRemaining)} remaining`}
                </Badge>
              </CardHeader>
              <CardBody className="pt-3">
                <ProgressBar value={pct} />

                {distributions.length === 0 ? (
                  <p className="mt-4 text-[13px] text-sand-400">
                    No dispatches recorded against this batch yet.
                  </p>
                ) : (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[640px] text-left text-[13px]">
                      <thead>
                        <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                          <th className="py-2 font-semibold">Vendor / Shop</th>
                          <th className="py-2 font-semibold text-right">Kola</th>
                          <th className="py-2 font-semibold text-right">Rate</th>
                          <th className="py-2 font-semibold text-right">Due</th>
                          <th className="py-2 font-semibold text-right">Paid</th>
                          <th className="py-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand-100">
                        {distributions.map((d) => {
                          const vendor = data.vendors.find((v) => v.id === d.vendorId);
                          return (
                            <tr key={d.id}>
                              <td className="py-2.5">
                                <Link
                                  href={`/distributions/${d.id}`}
                                  className="font-semibold text-sand-900 hover:text-forest-700"
                                >
                                  {vendor?.name ?? "—"}
                                </Link>
                              </td>
                              <td className="py-2.5 text-right text-sand-700">
                                {formatNumber(d.kolaQuantity)}
                              </td>
                              <td className="py-2.5 text-right text-sand-700">
                                {formatCurrency(d.dailySellingRate)}
                              </td>
                              <td className="py-2.5 text-right font-semibold text-sand-900">
                                {formatCurrency(d.netPayable)}
                              </td>
                              <td className="py-2.5 text-right text-sand-700">
                                {formatCurrency(d.amountCollected)}
                              </td>
                              <td className="py-2.5">
                                <PaymentStatusBadge distribution={d} />
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
          );
        })}
      </div>
    </div>
  );
}
