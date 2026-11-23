"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { saleRefs } from "@/src/store/selectors";
import {
  formatCurrency,
  formatDate,
  formatNumber,
  initials,
} from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/Card";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Icon } from "@/src/components/icons";
import { Modal } from "@/src/components/ui/Modal";
import { ProgressBar } from "@/src/components/ui/ProgressBar";
import { PaymentStatusBadge } from "@/src/components/domain/PaymentStatusBadge";
import { EmptyState } from "@/src/components/ui/EmptyState";

function DetailRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-sand-100 py-2.5 last:border-0">
      <span className="text-[13px] text-sand-500">{label}</span>
      <span className="text-[13.5px] font-semibold text-sand-900">{value}</span>
    </div>
  );
}

export function SaleDetailScreen({ id }: { id: string }) {
  const router = useRouter();
  const { data, deleteSale } = useAppData();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const sale = data.sales.find((d) => d.id === id);

  if (!sale) {
    return (
      <EmptyState
        icon={<Icon.AlertCircle className="h-6 w-6" />}
        title="Sale not found"
        description="It may have been removed."
        action={
          <Link href="/distributions">
            <Button size="sm">Back to Sales</Button>
          </Link>
        }
      />
    );
  }

  const { vendor, batch, broker } = saleRefs(data, sale);
  const unit = sale.rateBasis === "per_kola" ? "/ kola" : "/ kg";
  const methodLabel = PAYMENT_METHODS.find(
    (m) => m.value === sale.paymentMethod,
  )?.label;
  const collectionPct =
    sale.netPayable > 0 ? (sale.amountCollected / sale.netPayable) * 100 : 100;

  async function handleDelete() {
    try {
      await deleteSale(sale!.id);
      router.push("/distributions");
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : "Failed to delete Sale",
      );
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
            <Icon.ArrowLeft className="h-4 w-4" /> Back to Sales
          </Link>
          <div className="mt-2.5 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-100 text-[13px] font-bold text-forest-700">
              {initials(vendor?.name ?? "?")}
            </span>
            <div>
              <h2 className="text-[20px] font-extrabold text-sand-900">
                {vendor?.name ?? "Unknown customer"}
              </h2>
              <p className="text-[12.5px] text-sand-500">
                {sale.kayaType} · {formatDate(sale.date)}
              </p>
            </div>
            <PaymentStatusBadge sale={sale} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link href={`/distributions/${sale.id}/edit`}>
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
              <Badge tone="banana">{sale.qualityCategory}</Badge>
            </CardHeader>
            <CardBody className="pt-2">
              <DetailRow
                label="Shopkeeper / Customer"
                value={vendor?.name ?? "—"}
              />
              {broker && (
                <DetailRow
                  label="Stock Source (Broker Batch)"
                  value={`${broker.name} (${broker.location})`}
                />
              )}
              <DetailRow
                label={(sale.kayaTypes?.length ?? 1) > 1 ? "Kaya Types" : "Kaya Type"}
                value={sale.kayaType}
              />
              <DetailRow
                label="Quality Category"
                value={sale.qualityCategory}
              />
              {(sale.kayaItems?.length ?? 0) > 1 &&
                sale.kayaItems!.map((item) => (
                  <DetailRow
                    key={item.kayaType}
                    label={item.kayaType}
                    value={[
                      `${formatNumber(item.kolaQuantity)} kolas`,
                      item.totalWeight !== undefined && `${formatNumber(item.totalWeight, 2)} kg`,
                      item.qualityCategory ?? sale.qualityCategory,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  />
                ))}
              <DetailRow
                label={(sale.kayaItems?.length ?? 0) > 1 ? "Total Kola Quantity" : "Kola Quantity"}
                value={`${formatNumber(sale.kolaQuantity)} kolas`}
              />
              {(sale.thanduWeight ?? 0) > 0 && (
                <>
                  <DetailRow
                    label="Total Kola Weight"
                    value={`${formatNumber(sale.totalWeight + sale.thanduWeight!, 2)} kg`}
                  />
                  <DetailRow
                    label="Thandu Count"
                    value={`− ${formatNumber(sale.thanduWeight!, 2)} kg`}
                  />
                </>
              )}
              <DetailRow
                label={(sale.thanduWeight ?? 0) > 0 ? "Net Weight" : "Total Weight"}
                value={`${formatNumber(sale.totalWeight, 2)} kg`}
              />
              {/* Older sales recorded thandu as a stem count, not kg. */}
              {!sale.thanduWeight && sale.thanduCount > 0 && (
                <DetailRow
                  label="Thandu Count"
                  value={formatNumber(sale.thanduCount)}
                />
              )}
            </CardBody>
          </Card>

          {sale.customFields.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Additional Details</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                {sale.customFields.map((field) => (
                  <DetailRow
                    key={field.id}
                    label={field.label}
                    value={field.value || "—"}
                  />
                ))}
              </CardBody>
            </Card>
          )}

          {sale.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <p className="text-[13.5px] leading-relaxed text-sand-700">
                  {sale.notes}
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
              {sale.kayaItems?.some((i) => i.sellingRate !== undefined) ? (
                sale.kayaItems.map((item) => (
                  <DetailRow
                    key={item.kayaType}
                    label={`${item.kayaType} rate`}
                    value={`${formatCurrency(item.sellingRate ?? sale.dailySellingRate)} ${unit}`}
                  />
                ))
              ) : (
                <DetailRow
                  label="Daily Selling Rate"
                  value={`${formatCurrency(sale.dailySellingRate)} ${unit}`}
                />
              )}
              <DetailRow
                label="Gross Total"
                value={formatCurrency(sale.grossTotal)}
              />
              <DetailRow
                label="Discount / Allowance"
                value={formatCurrency(sale.discount)}
              />
              <DetailRow
                label="Net Payable"
                value={formatCurrency(sale.netPayable)}
              />
              <DetailRow label="Payment Method" value={methodLabel} />
              {sale.paymentMethod === "upi" && sale.paymentDetails && (
                <>
                  {sale.paymentDetails.upiId && (
                    <DetailRow
                      label="UPI ID"
                      value={sale.paymentDetails.upiId}
                    />
                  )}
                  {sale.paymentDetails.upiTransactionId && (
                    <DetailRow
                      label="UPI Transaction ID"
                      value={sale.paymentDetails.upiTransactionId}
                    />
                  )}
                </>
              )}
              {sale.paymentMethod === "bank_transfer" &&
                sale.paymentDetails && (
                  <>
                    {sale.paymentDetails.bankName && (
                      <DetailRow
                        label="Bank"
                        value={sale.paymentDetails.bankName}
                      />
                    )}
                    {sale.paymentDetails.accountHolderName && (
                      <DetailRow
                        label="Account Holder"
                        value={sale.paymentDetails.accountHolderName}
                      />
                    )}
                    {sale.paymentDetails.accountNumber && (
                      <DetailRow
                        label="Account No."
                        value={sale.paymentDetails.accountNumber}
                      />
                    )}
                    {sale.paymentDetails.ifscCode && (
                      <DetailRow
                        label="IFSC"
                        value={sale.paymentDetails.ifscCode}
                      />
                    )}
                    {sale.paymentDetails.bankReference && (
                      <DetailRow
                        label="UTR / Reference"
                        value={sale.paymentDetails.bankReference}
                      />
                    )}
                  </>
                )}

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between text-[12px] font-semibold text-sand-500">
                  <span>Collected {formatCurrency(sale.amountCollected)}</span>
                  <span>{Math.round(collectionPct)}%</span>
                </div>
                <ProgressBar value={collectionPct} tone="forest" />
              </div>

              <div
                className={`mt-4 flex items-center justify-between rounded-xl px-3.5 py-3 ${
                  sale.balanceDue > 0 ? "bg-red-50" : "bg-emerald-50"
                }`}
              >
                <span
                  className={`text-[12.5px] font-bold ${
                    sale.balanceDue > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {sale.balanceDue > 0 ? "Balance Due" : "Fully Settled"}
                </span>
                <span
                  className={`text-[16px] font-extrabold ${
                    sale.balanceDue > 0 ? "text-red-700" : "text-emerald-700"
                  }`}
                >
                  {formatCurrency(sale.balanceDue)}
                </span>
              </div>
            </CardBody>
          </Card>

          {broker && batch && (
            <Card>
              <CardHeader>
                <CardTitle>Broker &amp; Batch</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <>
                  <DetailRow label="Broker" value={broker.name} />
                  <DetailRow label="Location" value={broker.location} />
                  <DetailRow label="Vehicle No." value={broker.vehicleNumber} />
                  <DetailRow
                    label="Batch Date"
                    value={formatDate(batch.date)}
                  />
                  <Link
                    href={`/brokers/${broker.id}`}
                    className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-[12.5px] font-semibold text-forest-700 hover:bg-forest-50"
                  >
                    View broker <Icon.ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </>
              </CardBody>
            </Card>
          )}

          {vendor && (
            <Card>
              <CardHeader>
                <CardTitle>Customer Contact</CardTitle>
              </CardHeader>
              <CardBody className="pt-2">
                <DetailRow
                  label="Contact Person"
                  value={vendor.contactPerson || "—"}
                />
                <DetailRow label="Phone" value={vendor.phone || "—"} />
                <DetailRow label="Location" value={vendor.location} />
                <Link
                  href={`/vendors/${vendor.id}`}
                  className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-sand-200 py-2 text-[12.5px] font-semibold text-forest-700 hover:bg-forest-50"
                >
                  View customer ledger{" "}
                  <Icon.ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this Sale?"
      >
        <p className="text-[13.5px] text-sand-600">
          This will permanently remove the dispatch to{" "}
          <span className="font-semibold text-sand-900">{vendor?.name}</span>
          {batch ? " and restore the stock back to the broker batch" : ""}. This
          can&apos;t be undone.
        </p>
        {deleteError && (
          <p className="mt-3 text-[13px] font-medium text-red-600">
            {deleteError}
          </p>
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
