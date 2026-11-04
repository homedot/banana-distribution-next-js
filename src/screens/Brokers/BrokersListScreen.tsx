"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { getBrokerSummaries } from "@/src/store/selectors";
import { formatCurrency, formatNumber } from "@/src/utils/format";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Button } from "@/src/components/ui/Button";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { Icon } from "@/src/components/icons";
import { AddStockEntryModal } from "@/src/components/domain/AddStockEntryModal";
import { EmptyState } from "@/src/components/ui/EmptyState";

export function BrokersListScreen() {
  const { data } = useAppData();
  const [open, setOpen] = useState(false);
  const summaries = useMemo(() => getBrokerSummaries(data), [data]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-sand-500">
          {summaries.length} broker{summaries.length === 1 ? "" : "s"} · inward stock &amp;
          vendor dispatch in one place
        </p>
        <Button onClick={() => setOpen(true)}>
          <Icon.Plus className="h-4 w-4" /> Record Inward Stock
        </Button>
      </div>

      {summaries.length === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<Icon.Package className="h-6 w-6" />}
              title="No brokers yet"
              description="Record your first inward consignment from a Tamil Nadu broker."
              action={
                <Button size="sm" onClick={() => setOpen(true)}>
                  <Icon.Plus className="h-3.5 w-3.5" /> Record Inward Stock
                </Button>
              }
            />
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {summaries.map((s, i) => {
            const collectionPct =
              s.totalCollected + s.totalPending > 0
                ? (s.totalCollected / (s.totalCollected + s.totalPending)) * 100
                : 0;
            const stockPct =
              s.inwardKolas > 0 ? (s.dispatchedKolas / s.inwardKolas) * 100 : 0;

            return (
              <Link key={s.broker.id} href={`/brokers/${s.broker.id}`}>
                <Card className="h-full transition hover:shadow-lift">
                  <CardBody>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-banana-100 text-[13px] font-extrabold text-banana-700">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <p className="text-[14.5px] font-bold text-sand-900">
                            {s.broker.name}
                          </p>
                          <p className="text-[12px] text-sand-500">
                            {s.broker.location} · {s.batches[0]?.batch.kayaType ?? "—"}
                          </p>
                        </div>
                      </div>
                      <Badge tone={s.remainingKolas > 0 ? "banana" : "neutral"}>
                        {s.remainingKolas > 0 ? "Active" : "Closed"}
                      </Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-xl bg-sand-50 py-2.5">
                        <p className="text-[14px] font-extrabold text-sand-900">
                          {formatNumber(s.inwardKolas)}
                        </p>
                        <p className="text-[10.5px] font-medium text-sand-400">
                          Inward Kolas
                        </p>
                      </div>
                      <div className="rounded-xl bg-sand-50 py-2.5">
                        <p className="text-[14px] font-extrabold text-sand-900">
                          {formatNumber(s.dispatchedKolas)}
                        </p>
                        <p className="text-[10.5px] font-medium text-sand-400">Dispatched</p>
                      </div>
                      <div className="rounded-xl bg-sand-50 py-2.5">
                        <p className="text-[14px] font-extrabold text-sand-900">
                          {formatNumber(s.remainingKolas)}
                        </p>
                        <p className="text-[10.5px] font-medium text-sand-400">Remaining</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <ProgressBar value={stockPct} tone="banana" />
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        <p className="text-[11px] font-medium text-sand-400">Collected</p>
                        <p className="text-[14px] font-bold text-emerald-700">
                          {formatCurrency(s.totalCollected)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-sand-400">Pending</p>
                        <p className="text-[14px] font-bold text-red-600">
                          {formatCurrency(s.totalPending)}
                        </p>
                      </div>
                    </div>
                    <ProgressBar className="mt-2" value={collectionPct} tone="forest" />
                  </CardBody>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      <AddStockEntryModal open={open} onClose={() => setOpen(false)} />
    </div>
  );
}
