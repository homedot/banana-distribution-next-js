"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { distributionRefs } from "@/src/store/selectors";
import { formatCurrency, formatDate, formatNumber, initials } from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Icon } from "@/src/components/icons";
import { Modal } from "@/src/components/ui/Modal";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { EmptyState } from "@/src/components/ui/EmptyState";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-sand-100 py-2.5 last:border-0">
      <span className="text-[13px] text-sand-500">{label}</span>
      <span className="text-[13.5px] font-semibold text-sand-900">{value}</span>
    </div>
  );
}

export function DistributionDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { data, deleteDistribution } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const distribution = data.distributions.find((d) => d.id === id);

  if (!distribution) {
    return (
      <EmptyState
        icon={<Icon.AlertCircle className="h-6 w-6" />}
        title="Distribution not found"
        description="It may have been removed."
        action={
          <Link href="/distributions">
            <Button size="sm">Back to Distributions</Button>
          </Link>
        }
      />
    );
  }

  const { vendor, batch, broker } = distributionRefs(data, distribution);
  const methodLabel = PAYMENT_METHODS.find(
    (m) => m.value === distribution.paymentMethod
  )?.label;
  const collectionPct =
    distribution.netPayable > 0
      ? (distribution.amountCollected / distribution.netPayable) * 100
      : 100;

  async function handleDelete() {
    try {
      await deleteDistribution(distribution!.id);
      router.push("/distributions");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete distribution");
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/distributions"
            className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
          >
            <Icon.ArrowLeft className="h-4 w-4" /> Back to distributions
          </Link>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-100 text-[13px] font-bold text-forest-700">
              {initials(vendor?.name ?? "?")}
            </span>
            <div>
              <h2 className="text-[20px] font-extrabold text-sand-900">
                {vendor?.name ?? "Unknown vendor"}
              </h2>
              <p className="text-[12.5px] text-sand-500">
                {distribution.kayaType} · {formatDate(distribution.date)}
              </p>
            </div>
            <PaymentStatusBadge distribution={distribution} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/distributions/${distribution.id}/edit`}>
            <Button variant="secondary">
              <Icon.Edit className="h-4 w-4" /> Edit
            </Button>
          </Link>
          <Button variant="danger" onClick={() => setConfirmDelete(true)}>
            <Icon.Trash className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Dispatch Details</CardTitle>
              <Badge tone="banana">{distribution.qualityCategory}</Badge>
            </CardHeader>
            <CardBody className="pt-2">
              <DetailRow label="Shopkeeper / Vendor" value={vendor?.name ?? "—"} />
              <DetailRow
                label="Stock Source (Broker Batch)"
                value={`${broker?.name ?? "—"} (${broker?.location ?? "—"})`}
              />
              <DetailRow label="Kaya Type" value={distribution.kayaType} />
              <DetailRow label="Quality Category" value={distribution.qualityCategory} />
              <DetailRow
                label="Kola Quantity"
                value={`${formatNumber(distribution.kolaQuantity)} kolas`}
              />
              <DetailRow
                label="Total Weight"
                value={`${formatNumber(distribution.totalWeight)} kg`}
              />
              <DetailRow
                label="Thandu Count"
                value={formatNumber(distribution.thanduCount)}
              />
            </CardBody>
          </Card>

          {distribution.customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                {distribution.customFields.map((field) => (
                  <DetailRow key={field.id} label={field.label} value={field.value || "—"} />
                ))}
              </CardBody>
            </Card>
          )}

          {distribution.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <p className="text-[13.5px] leading-relaxed text-sand-700">
                  {distribution.notes}
                </p>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardBody className="pt-2">
              <DetailRow
                label="Daily Selling Rate"
                value={`${formatCurrency(distribution.dailySellingRate)} ${
                  distribution.rateBasis === "per_kola" ? "/ kola" : "/ kg"
                }`}
              />
              <DetailRow label="Gross Total" value={formatCurrency(distribution.grossTotal)} />
              <DetailRow
                label="Discount / Allowance"
                value={formatCurrency(distribution.discount)}
              />
              <DetailRow label="Net Payable" value={formatCurrency(distribution.netPayable)} />
              <DetailRow label="Payment Method" value={methodLabel} />

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-sand-500">
                  <span>Collected {formatCurrency(distribution.amountCollected)}</span>
                  <span>{Math.round(collectionPct)}%</span>
                </div>
                <ProgressBar value={collectionPct} tone="forest" />
              </div>

              <div
                className={`mt-4 flex items-center justify-between rounded-xl px-3.5 py-3 ${
                  distribution.balanceDue > 0 ? "bg-red-50" : "bg-emerald-50"
                }`}
              >
                <span
                  className={`text-[12.5px] font-bold ${
                    distribution.balanceDue > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {distribution.balanceDue > 0 ? "Balance Due" : "Fully Settled"}
                </span>
                <span
                  className={`text-[16px] font-extrabold ${
                    distribution.balanceDue > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(distribution.balanceDue)}
                </span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Broker &amp; Batch</CardTitle>
            </CardHeader>
            <CardBody className="pt-2">
              {broker && batch ? (
                <>
                  <DetailRow label="Broker" value={broker.name} />
                  <DetailRow label="Location" value={broker.location} />
                  <DetailRow label="Vehicle No." value={broker.vehicleNumber} />
                  <DetailRow label="Batch Date" value={formatDate(batch.date)} />
                  <Link
                    href={`/brokers/${broker.id}`}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-[12.5px] font-semibold text-forest-700 hover:bg-forest-50"
                  >
                    View broker <Icon.ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              ) : (
                <p className="text-[13px] text-sand-400">Batch information unavailable</p>
              )}
            </CardBody>
          </Card>

          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle>Vendor Contact</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <DetailRow label="Contact Person" value={vendor.contactPerson || "—"} />
                <DetailRow label="Phone" value={vendor.phone || "—"} />
                <DetailRow label="Location" value={vendor.location} />
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-[12.5px] font-semibold text-forest-700 hover:bg-forest-50"
                >
                  View vendor ledger <Icon.ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this distribution?"
      >
        <p className="text-[13.5px] text-sand-600">
          This will permanently remove the dispatch to{" "}
          <span className="font-semibold text-sand-900">{vendor?.name}</span> and
          restore the stock back to the broker batch. This can&apos;t be undone.
        </p>
        {deleteError && (
          <p className="mt-3 text-[13px] font-medium text-red-600">{deleteError}</p>
        )}
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmDelete(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Icon.Trash className="h-4 w-4" /> Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
}
