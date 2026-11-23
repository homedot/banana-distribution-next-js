"use client";

import { calcNetPayable } from "@/src/utils/calculations";
import { formatCurrency, formatNumber } from "@/src/utils/format";
import { Input } from "@/src/components/ui/Field";
import { saleTotals, type WizardState } from "@/src/screens/Sales/wizard/types";
import type { RateBasis } from "@/src/types";

export function StepPricing({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const { lines, grossTotal } = saleTotals(state);
  const discount = Number(state.discount) || 0;
  const perKg = state.rateBasis === "per_kg";
  const netPayable = calcNetPayable(grossTotal, discount);

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
          Rate Basis
        </span>
        <div className="flex rounded-xl border border-sand-200 bg-sand-50 p-1">
          {/* Per Kola pricing is hidden for now — only Per Kg is offered. */}
          {/* {(["per_kola", "per_kg"] as RateBasis[]).map((basis) => ( */}
          {(["per_kg"] as RateBasis[]).map((basis) => (
            <button
              key={basis}
              type="button"
              onClick={() => update({ rateBasis: basis })}
              className={`flex-1 rounded-lg py-2 text-[13px] font-semibold transition cursor-pointer ${
                state.rateBasis === basis
                  ? "bg-white text-forest-800 shadow-soft"
                  : "text-sand-500"
              }`}
            >
              {basis === "per_kola" ? "Per Kola" : "Per Kg"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <span className="text-[13px] font-semibold text-sand-700">
          Selling Rate per Kaya
          <span className="ml-0.5 text-banana-600">*</span>
        </span>

        {lines.length === 0 ? (
          <p className="rounded-xl bg-sand-50 px-3.5 py-3 text-[13px] text-sand-500">
            Select kaya types above to set a rate for each.
          </p>
        ) : (
          <div className="space-y-3">
            {lines.map((line) => (
              <div
                key={line.kayaType}
                className="grid items-end gap-3 rounded-2xl border border-sand-200 p-4 sm:grid-cols-[1fr_auto]"
              >
                <Input
                  label={`${line.kayaType} — ${perKg ? "rate per kg" : "rate per kola"}`}
                  required
                  type="number"
                  min={0}
                  step="0.01"
                  prefix="₹"
                  placeholder="Today's rate"
                  value={state.kayaRates[line.kayaType] ?? ""}
                  onChange={(e) =>
                    update({
                      kayaRates: {
                        ...state.kayaRates,
                        [line.kayaType]: e.target.value,
                      },
                    })
                  }
                />
                <div className="text-right sm:min-w-40 sm:pb-2.5">
                  <p className="text-[12px] text-sand-500">
                    {perKg
                      ? `${formatNumber(line.netWeight, 2)} kg net`
                      : `${formatNumber(line.kolaQuantity)} kolas`}{" "}
                    × {formatCurrency(line.sellingRate)}
                  </p>
                  <p className="text-[15px] font-bold text-sand-900">
                    {formatCurrency(line.amount)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3">
        <span className="text-[13px] font-semibold text-sand-600">
          Gross Total
        </span>
        <span className="text-[15px] font-extrabold text-sand-900">
          {formatCurrency(grossTotal)}
        </span>
      </div>

      <Input
        label="Discount / Allowance"
        type="number"
        min={0}
        step="0.01"
        prefix="₹"
        hint="Deductions for damaged fruits, stem weight, or customer loyalty"
        placeholder="0"
        value={state.discount}
        onChange={(e) => update({ discount: e.target.value })}
      />

      <div className="flex items-center justify-between rounded-xl bg-forest-50 px-4 py-3.5">
        <span className="text-[13px] font-bold text-forest-800">
          Net Payable Amount
        </span>
        <span className="text-[18px] font-extrabold text-forest-800">
          {formatCurrency(netPayable)}
        </span>
      </div>
    </div>
  );
}
