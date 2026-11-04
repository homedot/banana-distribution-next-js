"use client";

import { calcGrossTotal, calcNetPayable } from "@/src/utils/calculations";
import { formatCurrency } from "@/src/utils/format";
import { Input } from "@/src/components/ui/Field";
import type { WizardState } from "@/src/screens/Distributions/wizard/types";
import type { RateBasis } from "@/src/types";

export function StepPricing({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const rate = Number(state.dailySellingRate) || 0;
  const weight = Number(state.totalWeight) || 0;
  const kolas = Number(state.kolaQuantity) || 0;
  const discount = Number(state.discount) || 0;

  const grossTotal = calcGrossTotal(state.rateBasis, rate, weight, kolas);
  const netPayable = calcNetPayable(grossTotal, discount);

  return (
    <div className="space-y-5">
      <div>
        <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
          Rate Basis
        </span>
        <div className="flex rounded-xl border border-sand-200 bg-sand-50 p-1">
          {(["per_kola", "per_kg"] as RateBasis[]).map((basis) => (
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

      <Input
        label="Daily Selling Rate"
        required
        type="number"
        min={0}
        step="0.01"
        prefix="₹"
        placeholder="Current market rate"
        value={state.dailySellingRate}
        onChange={(e) => update({ dailySellingRate: e.target.value })}
      />

      <div className="flex items-center justify-between rounded-xl bg-sand-50 px-4 py-3">
        <span className="text-[13px] font-semibold text-sand-600">Gross Total</span>
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
        <span className="text-[13px] font-bold text-forest-800">Net Payable Amount</span>
        <span className="text-[18px] font-extrabold text-forest-800">
          {formatCurrency(netPayable)}
        </span>
      </div>
    </div>
  );
}
