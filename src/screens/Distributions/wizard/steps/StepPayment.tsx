"use client";

import {
  calcBalanceDue,
  calcGrossTotal,
  calcNetPayable,
} from "@/src/utils/calculations";
import { formatCurrency } from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import { Input, Select, Textarea } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { Icon } from "@/src/components/icons";
import { generateId } from "@/src/utils/id";
import type { WizardState } from "@/src/screens/Distributions/wizard/types";
import type { PaymentMethod } from "@/src/types";

export function StepPayment({
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
  const collected = Number(state.amountCollected) || 0;

  const grossTotal = calcGrossTotal(state.rateBasis, rate, weight, kolas);
  const netPayable = calcNetPayable(grossTotal, discount);
  const balanceDue = calcBalanceDue(netPayable, collected);
  const overCollected = collected > netPayable;

  function addCustomField() {
    update({
      customFields: [
        ...state.customFields,
        { id: generateId("field"), label: "", value: "" },
      ],
    });
  }

  function updateCustomField(id: string, patch: Partial<{ label: string; value: string }>) {
    update({
      customFields: state.customFields.map((f) =>
        f.id === id ? { ...f, ...patch } : f
      ),
    });
  }

  function removeCustomField(id: string) {
    update({ customFields: state.customFields.filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Amount Collected"
          required
          type="number"
          min={0}
          step="0.01"
          prefix="₹"
          hint="Paid upfront (Cash / UPI / Bank Transfer)"
          placeholder="0"
          value={state.amountCollected}
          onChange={(e) => update({ amountCollected: e.target.value })}
          error={overCollected ? "Collected amount exceeds net payable" : undefined}
        />
        <Select
          label="Payment Method"
          value={state.paymentMethod}
          onChange={(e) => update({ paymentMethod: e.target.value as PaymentMethod })}
        >
          {PAYMENT_METHODS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </div>

      <Input
        label="Dispatch Date"
        required
        type="date"
        value={state.date}
        onChange={(e) => update({ date: e.target.value })}
      />

      <div
        className={`flex items-center justify-between rounded-xl px-4 py-3.5 ${
          balanceDue > 0 ? "bg-red-50" : "bg-emerald-50"
        }`}
      >
        <span
          className={`text-[13px] font-bold ${
            balanceDue > 0 ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {balanceDue > 0 ? "Balance Due (added to vendor ledger)" : "Fully Settled"}
        </span>
        <span
          className={`text-[18px] font-extrabold ${
            balanceDue > 0 ? "text-red-700" : "text-emerald-700"
          }`}
        >
          {formatCurrency(balanceDue)}
        </span>
      </div>

      <div className="rounded-xl border border-sand-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[13px] font-semibold text-sand-700">
              Additional Fields
            </p>
            <p className="text-[12px] text-sand-400">
              Add any extra detail this dispatch needs to remember
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={addCustomField}>
            <Icon.Plus className="h-3.5 w-3.5" /> Add Field
          </Button>
        </div>

        {state.customFields.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {state.customFields.map((field) => (
              <div key={field.id} className="flex items-start gap-2">
                <input
                  value={field.label}
                  onChange={(e) =>
                    updateCustomField(field.id, { label: e.target.value })
                  }
                  placeholder="Field label (e.g. Vehicle No.)"
                  className="h-10 w-2/5 rounded-lg border border-sand-200 px-3 text-[13px] outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
                />
                <input
                  value={field.value}
                  onChange={(e) =>
                    updateCustomField(field.id, { value: e.target.value })
                  }
                  placeholder="Value"
                  className="h-10 flex-1 rounded-lg border border-sand-200 px-3 text-[13px] outline-none focus:border-forest-400 focus:ring-4 focus:ring-forest-100"
                />
                <button
                  type="button"
                  onClick={() => removeCustomField(field.id)}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sand-400 transition hover:bg-red-50 hover:text-red-600 cursor-pointer"
                >
                  <Icon.Trash className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Textarea
        label="Notes"
        placeholder="Anything worth remembering about this dispatch…"
        value={state.notes}
        onChange={(e) => update({ notes: e.target.value })}
      />
    </div>
  );
}
