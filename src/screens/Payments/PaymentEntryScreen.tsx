"use client";

import Link from "next/link";
import { useMemo, useState, useSyncExternalStore, type FormEvent } from "react";
import type { PaymentMethod } from "@/src/types";
import { useAppData } from "@/src/store/data-context";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import { formatCurrency, formatDate, initials } from "@/src/utils/format";
import { cn } from "@/src/utils/cn";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Input, Textarea } from "@/src/components/ui/Field";
import { DatePicker } from "@/src/components/ui/DatePicker";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { StatCard } from "@/src/components/ui/StatCard";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Modal } from "@/src/components/ui/Modal";
import { Icon } from "@/src/components/icons";
import { VendorPicker } from "@/src/components/domain/VendorPicker";

function todayISO() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

// Re-check the date every minute so "today" rolls over past midnight on an open tab.
function subscribeToClock(onChange: () => void) {
  const id = setInterval(onChange, 60_000);
  return () => clearInterval(id);
}

/**
 * Today's local date (YYYY-MM-DD), read only in the browser. During the server
 * prerender it returns "" so no `new Date()` is baked into the static shell
 * (required with cacheComponents).
 */
function useToday() {
  return useSyncExternalStore(subscribeToClock, todayISO, () => "");
}

const round2 = (n: number) => Math.round(n * 100) / 100;

const METHOD_LABEL: Record<PaymentMethod, string> = Object.fromEntries(
  PAYMENT_METHODS.map((m) => [m.value, m.label])
) as Record<PaymentMethod, string>;

const emptyForm = {
  vendorId: "",
  amount: "",
  method: "cash" as PaymentMethod,
  date: "", // "" = today; resolved in the browser via useToday()
  reference: "",
  notes: "",
};

export function PaymentEntryScreen() {
  const { data, loading, addPayment, deletePayment } = useAppData();
  const today = useToday();
  const [form, setForm] = useState(emptyForm);
  const paymentDate = form.date || today;
  const [errors, setErrors] = useState<{ vendor?: string; amount?: string; date?: string }>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setSavedMsg(null);
    setServerError(null);
  }

  const vendorById = useMemo(() => new Map(data.vendors.map((v) => [v.id, v])), [data.vendors]);

  // The vendor's unpaid sales, oldest first — the order a payment is applied in.
  const pendingSales = useMemo(
    () =>
      data.sales
        .filter((s) => s.vendorId === form.vendorId && s.balanceDue > 0)
        .sort((a, b) => a.date.localeCompare(b.date) || a.createdAt.localeCompare(b.createdAt)),
    [data.sales, form.vendorId]
  );
  const outstanding = round2(pendingSales.reduce((s, d) => s + d.balanceDue, 0));
  const amount = round2(Number(form.amount) || 0);

  // Preview of how the amount will be split across those sales.
  const allocation = useMemo(() => {
    const rows = [];
    let remaining = amount;
    for (const sale of pendingSales) {
      const applied = round2(Math.max(0, Math.min(remaining, sale.balanceDue)));
      remaining = round2(remaining - applied);
      rows.push({ sale, applied, after: round2(sale.balanceDue - applied) });
    }
    return rows;
  }, [pendingSales, amount]);

  const stats = useMemo(() => {
    if (!today) return { todayTotal: 0, monthTotal: 0, pendingAll: 0 };
    const month = today.slice(0, 7);
    let todayTotal = 0;
    let monthTotal = 0;
    for (const p of data.payments) {
      const day = p.date.slice(0, 10);
      if (day === today) todayTotal += p.amount;
      if (day.startsWith(month)) monthTotal += p.amount;
    }
    const pendingAll = data.sales.reduce((s, d) => s + (d.balanceDue > 0 ? d.balanceDue : 0), 0);
    return { todayTotal, monthTotal, pendingAll };
  }, [data.payments, data.sales, today]);

  function validate() {
    const next: typeof errors = {};
    if (!form.vendorId) next.vendor = "Select a customer";
    else if (outstanding <= 0) next.vendor = "This customer has no pending balance";
    if (amount <= 0) next.amount = "Enter an amount greater than zero";
    else if (outstanding > 0 && amount > outstanding)
      next.amount = `Cannot exceed the pending balance of ${formatCurrency(outstanding)}`;
    if (!paymentDate) next.date = "Select a date";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    setServerError(null);
    try {
      const payment = await addPayment({
        vendorId: form.vendorId,
        amount,
        method: form.method,
        date: new Date(`${paymentDate}T00:00:00.000Z`).toISOString(),
        reference: form.reference.trim(),
        notes: form.notes.trim(),
      });
      const vendorName = vendorById.get(payment.vendorId)?.name ?? "customer";
      setSavedMsg(`${formatCurrency(payment.amount)} recorded for ${vendorName}.`);
      setForm({ ...emptyForm, date: form.date, method: form.method });
      setErrors({});
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to save payment");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!toDelete) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await deletePayment(toDelete);
      setToDelete(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "Failed to delete payment");
    } finally {
      setDeleting(false);
    }
  }

  const paymentToDelete = data.payments.find((p) => p.id === toDelete);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Collected Today"
          value={formatCurrency(stats.todayTotal)}
          icon={<Icon.Wallet className="h-5 w-5" />}
          tone="forest"
        />
        <StatCard
          label="Collected This Month"
          value={formatCurrency(stats.monthTotal)}
          icon={<Icon.TrendingUp className="h-5 w-5" />}
          tone="banana"
        />
        <StatCard
          label="Total Pending"
          value={formatCurrency(stats.pendingAll)}
          icon={<Icon.Clock className="h-5 w-5" />}
          tone="danger"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-5">
        {/* Entry form */}
        <Card className="xl:col-span-3">
          <CardHeader>
            <CardTitle>New Payment</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <VendorPicker
                  value={form.vendorId}
                  onChange={(vendorId) => {
                    update("vendorId", vendorId);
                    setErrors((er) => ({ ...er, vendor: undefined, amount: undefined }));
                  }}
                />
                {errors.vendor && (
                  <p className="mt-1.5 text-xs font-medium text-red-600">{errors.vendor}</p>
                )}
              </div>

              {form.vendorId && (
                <div
                  className={cn(
                    "flex items-center justify-between rounded-xl px-4 py-3",
                    outstanding > 0 ? "bg-red-50" : "bg-emerald-50"
                  )}
                >
                  <span
                    className={cn(
                      "text-[13px] font-semibold",
                      outstanding > 0 ? "text-red-700" : "text-emerald-700"
                    )}
                  >
                    {outstanding > 0
                      ? `Pending across ${pendingSales.length} sale${pendingSales.length === 1 ? "" : "s"}`
                      : "No pending balance — fully settled"}
                  </span>
                  <span
                    className={cn(
                      "text-[17px] font-extrabold",
                      outstanding > 0 ? "text-red-700" : "text-emerald-700"
                    )}
                  >
                    {formatCurrency(outstanding)}
                  </span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Input
                    label="Amount Received"
                    required
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step="0.01"
                    prefix="₹"
                    placeholder="0"
                    value={form.amount}
                    error={errors.amount}
                    disabled={!form.vendorId || outstanding <= 0}
                    onChange={(e) => {
                      update("amount", e.target.value);
                      setErrors((er) => ({ ...er, amount: undefined }));
                    }}
                  />
                  {outstanding > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        update("amount", String(outstanding));
                        setErrors((er) => ({ ...er, amount: undefined }));
                      }}
                      className="mt-1.5 text-[12px] font-semibold text-forest-700 hover:underline cursor-pointer"
                    >
                      Pay full balance ({formatCurrency(outstanding)})
                    </button>
                  )}
                </div>
                <DatePicker
                  label="Payment Date"
                  required
                  max={today || undefined}
                  value={paymentDate}
                  error={errors.date}
                  onChange={(v) => update("date", v)}
                />
              </div>

              <div>
                <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
                  Payment Method<span className="ml-0.5 text-banana-600">*</span>
                </span>
                <div className="flex flex-wrap gap-2">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      type="button"
                      key={m.value}
                      onClick={() => update("method", m.value)}
                      className={cn(
                        "h-10 rounded-xl px-4 text-[13px] font-semibold transition cursor-pointer",
                        form.method === m.value
                          ? "bg-forest-700 text-white"
                          : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                      )}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {form.method !== "cash" && (
                <Input
                  label="Reference / Transaction ID"
                  placeholder={form.method === "upi" ? "UPI ref no." : "Bank reference no."}
                  value={form.reference}
                  onChange={(e) => update("reference", e.target.value)}
                />
              )}

              <Textarea
                label="Notes"
                placeholder="Optional"
                className="min-h-20"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
              />

              {serverError && (
                <p className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
                  <Icon.AlertCircle className="h-4 w-4 shrink-0" /> {serverError}
                </p>
              )}
              {savedMsg && (
                <p className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-medium text-emerald-700">
                  <Icon.Check className="h-4 w-4 shrink-0" /> Payment saved — {savedMsg}
                </p>
              )}

              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={saving}>
                  <Icon.Check className="h-4 w-4" />
                  {saving ? "Saving…" : "Save Payment"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        {/* Allocation preview */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Applied To</CardTitle>
            <Badge tone="neutral">Oldest first</Badge>
          </CardHeader>
          <CardBody className="pt-3">
            {!form.vendorId ? (
              <EmptyState
                icon={<Icon.Store className="h-6 w-6" />}
                title="Select a customer"
                description="Their unpaid sales will appear here, showing how the payment is applied."
              />
            ) : pendingSales.length === 0 ? (
              <EmptyState
                icon={<Icon.Check className="h-6 w-6" />}
                title="All settled"
                description="This customer has no unpaid sales."
              />
            ) : (
              <ul className="divide-y divide-sand-100">
                {allocation.map(({ sale, applied, after }) => (
                  <li key={sale.id} className="flex items-center justify-between gap-3 py-3">
                    <div>
                      <Link
                        href={`/distributions/${sale.id}`}
                        className="text-[13px] font-semibold text-sand-900 hover:underline"
                      >
                        {formatDate(sale.date)}
                      </Link>
                      <p className="text-[11.5px] text-sand-500">
                        {sale.kayaType} · due {formatCurrency(sale.balanceDue)}
                      </p>
                    </div>
                    <div className="text-right">
                      {applied > 0 ? (
                        <>
                          <p className="text-[13px] font-bold text-emerald-700">
                            −{formatCurrency(applied)}
                          </p>
                          {after > 0 ? (
                            <p className="text-[11.5px] text-sand-500">
                              {formatCurrency(after)} left
                            </p>
                          ) : (
                            <Badge tone="success">Settled</Badge>
                          )}
                        </>
                      ) : (
                        <p className="text-[12px] text-sand-400">Not covered</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <Badge tone="neutral">{data.payments.length} entries</Badge>
        </CardHeader>
        <CardBody className="p-0 pt-3">
          {loading && data.payments.length === 0 ? (
            <p className="px-5 pb-5 text-sm text-sand-400">Loading…</p>
          ) : data.payments.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState
                icon={<Icon.Wallet className="h-6 w-6" />}
                title="No payments yet"
                description="Payments you record will be listed here."
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-[13px]">
                <thead>
                  <tr className="border-b border-sand-100 text-[11px] uppercase tracking-wide text-sand-400">
                    <th className="px-5 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Customer</th>
                    <th className="px-3 py-3 font-semibold">Method</th>
                    <th className="px-3 py-3 font-semibold">Reference</th>
                    <th className="px-3 py-3 font-semibold">Applied To</th>
                    <th className="px-3 py-3 text-right font-semibold">Amount</th>
                    <th className="px-5 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand-100">
                  {data.payments.map((p) => {
                    const vendor = vendorById.get(p.vendorId);
                    return (
                      <tr key={p.id} className="transition hover:bg-sand-50/70">
                        <td className="px-5 py-3 text-sand-600">{formatDate(p.date)}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest-100 text-[10px] font-bold text-forest-700">
                              {initials(vendor?.name ?? "?")}
                            </span>
                            <span className="font-semibold text-sand-900">
                              {vendor?.name ?? "Deleted customer"}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <Badge tone="forest">{METHOD_LABEL[p.method] ?? p.method}</Badge>
                        </td>
                        <td className="px-3 py-3 text-sand-500">{p.reference || "—"}</td>
                        <td className="px-3 py-3 text-sand-500">
                          {p.allocations.length} sale{p.allocations.length === 1 ? "" : "s"}
                        </td>
                        <td className="px-3 py-3 text-right font-bold text-emerald-700">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            type="button"
                            title="Delete payment"
                            onClick={() => {
                              setDeleteError(null);
                              setToDelete(p.id);
                            }}
                            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-sand-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                          >
                            <Icon.Trash className="h-4 w-4" />
                          </button>
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

      <Modal
        open={toDelete !== null}
        onClose={() => !deleting && setToDelete(null)}
        title="Delete this payment?"
      >
        {paymentToDelete && (
          <p className="text-[13.5px] text-sand-600">
            {formatCurrency(paymentToDelete.amount)} from{" "}
            <span className="font-semibold text-sand-900">
              {vendorById.get(paymentToDelete.vendorId)?.name ?? "this customer"}
            </span>{" "}
            will be removed, and the amount will be added back to the pending balance of the{" "}
            {paymentToDelete.allocations.length} sale
            {paymentToDelete.allocations.length === 1 ? "" : "s"} it paid.
          </p>
        )}
        {deleteError && (
          <p className="mt-3 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            {deleteError}
          </p>
        )}
        <div className="mt-5 flex justify-end gap-2.5">
          <Button variant="secondary" onClick={() => setToDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={deleting}>
            <Icon.Trash className="h-4 w-4" />
            {deleting ? "Deleting…" : "Delete payment"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
