"use client";

import {
  calcBalanceDue,
  calcGrossTotal,
  calcNetPayable,
} from "@/src/utils/calculations";
import { formatCurrency } from "@/src/utils/format";
import { PAYMENT_METHODS } from "@/src/utils/constants";
import { Input, Textarea } from "@/src/components/ui/Field";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { Button } from "@/src/components/ui/Button";
import { Icon } from "@/src/components/icons";
import { generateId } from "@/src/utils/id";
import {
  ACCOUNT_NUMBER_PATTERN,
  IFSC_PATTERN,
  UPI_ID_PATTERN,
  type WizardState,
} from "@/src/screens/Sales/wizard/types";
import type { PaymentDetails, PaymentMethod } from "@/src/types";

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

  const details = state.paymentDetails;
  const needsDetails = collected > 0;
  function setDetail<K extends keyof PaymentDetails>(
    key: K,
    value: PaymentDetails[K],
  ) {
    update({ paymentDetails: { ...details, [key]: value } });
  }
  // Inline format hints — shown only once something has been typed.
  const upiIdError =
    details.upiId.trim() && !UPI_ID_PATTERN.test(details.upiId.trim())
      ? "Enter a valid UPI ID, e.g. name@okaxis"
      : undefined;
  const accountError =
    details.accountNumber.trim() &&
    !ACCOUNT_NUMBER_PATTERN.test(details.accountNumber.replace(/\s+/g, ""))
      ? "Should be 9–18 digits"
      : undefined;
  const ifscError =
    details.ifscCode.trim() &&
    !IFSC_PATTERN.test(details.ifscCode.trim().toUpperCase())
      ? "Format: 4 letters, 0, then 6 characters (e.g. SBIN0001234)"
      : undefined;

  function addCustomField() {
    update({
      customFields: [
        ...state.customFields,
        { id: generateId("field"), label: "", value: "" },
      ],
    });
  }

  function updateCustomField(
    id: string,
    patch: Partial<{ label: string; value: string }>,
  ) {
    update({
      customFields: state.customFields.map((f) =>
        f.id === id ? { ...f, ...patch } : f,
      ),
    });
  }

  function removeCustomField(id: string) {
    update({ customFields: state.customFields.filter((f) => f.id !== id) });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-5">
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
          error={
            overCollected ? "Collected amount exceeds net payable" : undefined
          }
        />
        <Dropdown<PaymentMethod>
          label="Payment Method"
          required
          value={state.paymentMethod}
          options={PAYMENT_METHODS.map((m) => ({
            value: m.value,
            label: m.label,
          }))}
          onChange={(paymentMethod) => update({ paymentMethod })}
        />
      </div>

      {state.paymentMethod === "upi" && (
        <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-forest-800">
            <Icon.Phone className="h-4 w-4" /> UPI Details
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="UPI ID"
              required={needsDetails}
              placeholder="name@okaxis"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              value={details.upiId}
              error={upiIdError}
              onChange={(e) => setDetail("upiId", e.target.value)}
            />
            <Input
              label="UPI Transaction ID"
              placeholder="12-digit UPI ref no. (optional)"
              autoComplete="off"
              value={details.upiTransactionId}
              onChange={(e) => setDetail("upiTransactionId", e.target.value)}
            />
          </div>
        </div>
      )}

      {state.paymentMethod === "bank_transfer" && (
        <div className="rounded-xl border border-forest-100 bg-forest-50/50 p-4">
          <p className="mb-3 flex items-center gap-1.5 text-[13px] font-bold text-forest-800">
            <Icon.Wallet className="h-4 w-4" /> Bank Transfer Details
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Bank Name"
              required={needsDetails}
              placeholder="e.g. State Bank of India"
              value={details.bankName}
              onChange={(e) => setDetail("bankName", e.target.value)}
            />
            <Input
              label="Account Holder Name"
              placeholder="Name on the account"
              value={details.accountHolderName}
              onChange={(e) => setDetail("accountHolderName", e.target.value)}
            />
            <Input
              label="Account Number"
              placeholder="9–18 digits"
              inputMode="numeric"
              autoComplete="off"
              value={details.accountNumber}
              error={accountError}
              onChange={(e) =>
                setDetail(
                  "accountNumber",
                  e.target.value.replace(/[^\d\s]/g, ""),
                )
              }
            />
            <Input
              label="IFSC Code"
              placeholder="SBIN0001234"
              autoComplete="off"
              maxLength={11}
              className="uppercase"
              value={details.ifscCode}
              error={ifscError}
              onChange={(e) =>
                setDetail("ifscCode", e.target.value.toUpperCase())
              }
            />
            <Input
              label="UTR / Reference No."
              required={needsDetails}
              placeholder="Bank transaction reference"
              autoComplete="off"
              value={details.bankReference}
              onChange={(e) => setDetail("bankReference", e.target.value)}
            />
          </div>
        </div>
      )}

      <Input
        label="Date"
        type="date"
        hint="Defaults to today if left blank"
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
          {balanceDue > 0
            ? "Balance Due (added to vendor ledger)"
            : "Fully Settled"}
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
