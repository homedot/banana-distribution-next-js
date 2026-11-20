"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { getVendorSummary, groupSalesByDay } from "@/src/store/selectors";
import { formatCurrency, formatDate, formatNumber } from "@/src/utils/format";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Badge } from "@/src/components/ui/Badge";
import { Icon } from "@/src/components/icons";
import { Button } from "@/src/components/ui/Button";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { DateRangeFilter } from "@/src/components/domain/DateRangeFilter";
import { VendorFormModal } from "@/src/components/domain/AddVendorModal";
import {
  ALL_TIME,
  inRange,
  isAllTime,
  rangePhrase,
  toDayKey,
  type PeriodRange,
} from "@/src/utils/period";

export function VendorDetailScreen({
  id,
  initialRange = ALL_TIME,
}: {
  id: string;
  initialRange?: PeriodRange;
}) {
  const { data } = useAppData();
  const [range, setRange] = useState<PeriodRange>(initialRange);
  const [editOpen, setEditOpen] = useState(false);
  const filtered = !isAllTime(range);
  const phrase = rangePhrase(range);

  // Overall figures (for the "pending" badge — what the vendor owes right now).
  const summary = getVendorSummary(data, id);
  // Figures for the selected From → To dates only.
  const periodSummary = getVendorSummary(
    { ...data, sales: data.sales.filter((d) => inRange(toDayKey(d.date), range)) },
    id,
  );

  if (!summary) {
    return (
      <EmptyState
        icon={<Icon.AlertCircle className="h-6 w-6" />}
        title="Customer not found"
        action={
          <Link href="/vendors">
            <Button size="sm">Back to Customers</Button>
          </Link>
        }
      />
    );
  }

  const { vendor, totalPending: overallPending } = summary;
  const { sales, totalKolas, totalNetPayable, totalCollected, totalPending } =
    periodSummary ?? summary;
  const grouped = groupSalesByDay(sales);

  return (
    <div className="space-y-5">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
      >
        <Icon.ArrowLeft className="h-4 w-4" /> Back to vendors
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-100 text-[15px] font-extrabold text-forest-700">
            {vendor.name.slice(0, 2).toUpperCase()}
          </span>
          <div>
            <h2 className="text-[20px] font-extrabold text-sand-900">
              {vendor.name}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-sand-500">
              <span className="flex items-center gap-1.5">
                <Icon.MapPin className="h-3.5 w-3.5" /> {vendor.location}
              </span>
              {vendor.contactPerson && (
                <span className="flex items-center gap-1.5">
                  <Icon.Users className="h-3.5 w-3.5" /> {vendor.contactPerson}
                </span>
              )}
              {vendor.phone && (
                <span className="flex items-center gap-1.5">
                  <Icon.Phone className="h-3.5 w-3.5" /> {vendor.phone}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={overallPending > 0 ? "danger" : "success"}>
            {overallPending > 0
              ? `${formatCurrency(overallPending)} pending in total`
              : "Fully settled"}
          </Badge>
          <Button variant="secondary" onClick={() => setEditOpen(true)}>
            <Icon.Edit className="h-4 w-4" /> Edit
          </Button>
        </div>
      </div>

      <VendorFormModal open={editOpen} vendor={vendor} onClose={() => setEditOpen(false)} />

      <DateRangeFilter value={range} onApply={setRange} />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: "Kolas", value: formatNumber(totalKolas), tone: "text-sand-900" },
          { label: "Billed", value: formatCurrency(totalNetPayable), tone: "text-sand-900" },
          { label: "Collected", value: formatCurrency(totalCollected), tone: "text-emerald-700" },
          { label: "Pending", value: formatCurrency(totalPending), tone: "text-red-600" },
        ].map((c) => (
          <Card key={c.label}>
            <CardBody className="text-center">
              <p className={`text-[22px] font-extrabold ${c.tone}`}>{c.value}</p>
              <p className="mt-0.5 text-[14px] font-semibold text-sand-500">
                {c.label} {filtered ? phrase : ""}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Daily Transaction Log</CardTitle>
            {filtered && (
              <p className="mt-0.5 text-[12px] text-sand-500">
                {sales.length} {sales.length === 1 ? "sale" : "sales"} {phrase}
              </p>
            )}
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          {grouped.length === 0 ? (
            <EmptyState
              icon={<Icon.Truck className="h-6 w-6" />}
              title={filtered ? `No sales ${phrase}` : "No dispatches yet"}
              description={
                filtered
                  ? "This customer had no sales in this period. Try other dates, or press Clear to see all."
                  : "Transactions with this customer will appear here, grouped by day."
              }
            />
          ) : (
            <div className="space-y-6">
              {grouped.map(({ date, sales: dayItems }) => {
                const dayTotal = dayItems.reduce((s, d) => s + d.netPayable, 0);
                const dayPending = dayItems.reduce(
                  (s, d) => s + d.balanceDue,
                  0,
                );
                return (
                  <div key={date}>
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[12.5px] font-bold text-sand-700">
                        {formatDate(date)}
                      </p>
                      <p className="text-[12px] text-sand-400">
                        {formatCurrency(dayTotal)} total
                        {dayPending > 0 && (
                          <span className="ml-2 font-semibold text-red-600">
                            {formatCurrency(dayPending)} pending
                          </span>
                        )}
                      </p>
                    </div>
                    <ul className="space-y-2">
                      {dayItems.map((d) => (
                        <li key={d.id}>
                          <Link
                            href={`/distributions/${d.id}`}
                            className="flex items-center justify-between rounded-xl border border-sand-100 px-3.5 py-2.5 transition hover:border-forest-200 hover:bg-forest-50/40"
                          >
                            <div>
                              <p className="text-[13px] font-semibold text-sand-900">
                                {d.kayaType} · {formatNumber(d.kolaQuantity)}{" "}
                                kolas
                              </p>
                              <p className="text-[11.5px] text-sand-500">
                                {formatNumber(d.totalWeight)} kg ·{" "}
                                {d.qualityCategory}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-bold text-sand-900">
                                {formatCurrency(d.netPayable)}
                              </span>
                              <PaymentStatusBadge sale={d} />
                            </div>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
