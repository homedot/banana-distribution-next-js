"use client";

import { useAppData } from "@/src/store/data-context";
import {
  calcBalanceDue,
  calcGrossTotal,
  calcNetPayable,
} from "@/src/utils/calculations";
import { formatCurrency, formatDate, formatNumber } from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import { Icon } from "@/src/components/icons";
import type { WizardState } from "@/src/screens/Distributions/wizard/types";

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-1.5 text-[13px]">
      <span className="text-sand-500">{label}</span>
      <span className="font-semibold text-sand-900">{value}</span>
    </div>
  );
}

export function StepReview({
  state,
  onEditStep,
}: {
  state: WizardState;
  onEditStep: (index: number) => void;
}) {
  const { data } = useAppData();
  const vendor = data.vendors.find((v) => v.id === state.vendorId);
  const batch = data.batches.find((b) => b.id === state.batchId);
  const broker = batch ? data.brokers.find((b) => b.id === batch.brokerId) : undefined;

  const rate = Number(state.dailySellingRate) || 0;
  const weight = Number(state.totalWeight) || 0;
  const kolas = Number(state.kolaQuantity) || 0;
  const discount = Number(state.discount) || 0;
  const collected = Number(state.amountCollected) || 0;

  const grossTotal = calcGrossTotal(state.rateBasis, rate, weight, kolas);
  const netPayable = calcNetPayable(grossTotal, discount);
  const balanceDue = calcBalanceDue(netPayable, collected);
  const methodLabel = PAYMENT_METHODS.find((m) => m.value === state.paymentMethod)?.label;

  return (
    <div className="space-y-4">
      <section className="rounded-xl border border-sand-200 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-sand-400">
            Vendor &amp; Stock
          </p>
          <button
            onClick={() => onEditStep(0)}
            className="flex items-center gap-1 text-[12px] font-semibold text-forest-700 hover:underline cursor-pointer"
          >
            <Icon.Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </header>
        <Row label="Vendor" value={vendor?.name ?? "—"} />
        <Row label="Stock Source" value={`${broker?.name ?? "—"} (${broker?.location ?? "—"})`} />
        <Row label="Kaya Type" value={state.kayaType || "—"} />
      </section>

      <section className="rounded-xl border border-sand-200 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-sand-400">
            Quantity &amp; Quality
          </p>
          <button
            onClick={() => onEditStep(1)}
            className="flex items-center gap-1 text-[12px] font-semibold text-forest-700 hover:underline cursor-pointer"
          >
            <Icon.Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </header>
        <Row label="Quality Category" value={state.qualityCategory} />
        <Row label="Kola Quantity" value={`${formatNumber(kolas)} kolas`} />
        <Row label="Total Weight" value={`${formatNumber(weight)} kg`} />
        <Row label="Thandu Count" value={formatNumber(Number(state.thanduCount) || 0)} />
      </section>

      <section className="rounded-xl border border-sand-200 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-sand-400">
            Pricing
          </p>
          <button
            onClick={() => onEditStep(2)}
            className="flex items-center gap-1 text-[12px] font-semibold text-forest-700 hover:underline cursor-pointer"
          >
            <Icon.Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </header>
        <Row
          label="Daily Selling Rate"
          value={`${formatCurrency(rate)} ${state.rateBasis === "per_kola" ? "/ kola" : "/ kg"}`}
        />
        <Row label="Gross Total" value={formatCurrency(grossTotal)} />
        <Row label="Discount / Allowance" value={formatCurrency(discount)} />
        <Row label="Net Payable" value={formatCurrency(netPayable)} />
      </section>

      <section className="rounded-xl border border-sand-200 p-4">
        <header className="flex items-center justify-between">
          <p className="text-[12px] font-bold uppercase tracking-wide text-sand-400">
            Payment
          </p>
          <button
            onClick={() => onEditStep(3)}
            className="flex items-center gap-1 text-[12px] font-semibold text-forest-700 hover:underline cursor-pointer"
          >
            <Icon.Edit className="h-3.5 w-3.5" /> Edit
          </button>
        </header>
        <Row label="Amount Collected" value={formatCurrency(collected)} />
        <Row label="Payment Method" value={methodLabel} />
        <Row label="Dispatch Date" value={state.date ? formatDate(state.date) : "—"} />
        {state.customFields
          .filter((f) => f.label.trim())
          .map((f) => (
            <Row key={f.id} label={f.label} value={f.value || "—"} />
          ))}
      </section>

      <div
        className={`flex items-center justify-between rounded-xl px-4 py-4 ${
          balanceDue > 0 ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        <span
          className={`text-[14px] font-bold ${
            balanceDue > 0 ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {balanceDue > 0 ? "Balance Due to Collect" : "Fully Settled on Dispatch"}
        </span>
        <span
          className={`text-[20px] font-extrabold ${
            balanceDue > 0 ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {formatCurrency(balanceDue)}
        </span>
      </div>
    </div>
  );
}
