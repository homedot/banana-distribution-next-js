"use client";

import { VendorPicker } from "@/src/components/domain/VendorPicker";
import { Icon } from "@/src/components/icons";
import Link from "next/link";
import { cn } from "@/src/utils/cn";
import { formatCurrency } from "@/src/utils/format";
import { useAppData } from "@/src/store/data-context";
import type { WizardState } from "@/src/screens/Sales/wizard/types";

export function StepVendorKaya({
  state,
  update,
  showErrors,
  editingSaleId,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  showErrors?: boolean;
  /** When editing, that sale's own balance is left out of the customer's pending amount. */
  editingSaleId?: string;
}) {
  const { data, loading } = useAppData();
  const customerSales = state.vendorId
    ? data.sales.filter((d) => d.vendorId === state.vendorId && d.id !== editingSaleId)
    : [];
  const pendingAmount = customerSales.reduce((sum, d) => sum + (d.balanceDue || 0), 0);
  const pendingCount = customerSales.filter((d) => d.balanceDue > 0).length;

  // Options come from Kola Categories. Keep an older sale's kaya types
  // selectable even if they've since been removed from that list.
  const options: string[] = data.kayaTypes.map((k) => k.name);
  for (const k of state.kayaTypes) if (!options.includes(k)) options.unshift(k);

  const selected = new Set(state.kayaTypes);
  const error = showErrors && selected.size === 0 ? "Select at least one kaya type" : undefined;

  function toggle(kaya: string) {
    // Keep the list's order, regardless of the order they were tapped in.
    const next = selected.has(kaya)
      ? state.kayaTypes.filter((k) => k !== kaya)
      : options.filter((k) => k === kaya || selected.has(k));
    update({ kayaTypes: next });
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <VendorPicker value={state.vendorId} onChange={(vendorId) => update({ vendorId })} />
        {state.vendorId && (
          <div
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl px-3.5 py-2.5",
              pendingAmount > 0 ? "bg-red-50" : "bg-emerald-50",
            )}
          >
            <span
              className={cn(
                "text-[13px] font-semibold",
                pendingAmount > 0 ? "text-red-700" : "text-emerald-700",
              )}
            >
              {pendingAmount > 0
                ? `Pending amount${editingSaleId ? " (other sales)" : ""} · ${pendingCount} ${
                    pendingCount === 1 ? "sale" : "sales"
                  }`
                : "No pending amount"}
            </span>
            {pendingAmount > 0 && (
              <span className="text-[15px] font-extrabold text-red-700">
                {formatCurrency(pendingAmount)}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span id="kaya-types-label" className="text-[15px] font-bold text-sand-800">
            Kaya Types
            <span className="ml-0.5 text-banana-600">*</span>
          </span>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => update({ kayaTypes: [] })}
              className="cursor-pointer text-[13px] font-semibold text-sand-500 hover:text-sand-800"
            >
              Clear ({selected.size})
            </button>
          )}
        </div>

        {options.length === 0 ? (
          <p className="rounded-xl bg-sand-50 px-3.5 py-3 text-[13px] text-sand-600">
            {loading ? (
              "Loading kola categories…"
            ) : (
              <>
                No kola categories yet.{" "}
                <Link
                  href="/kola-categories"
                  className="font-semibold text-forest-700 underline hover:text-forest-800"
                >
                  Add one in Kola Categories
                </Link>
                .
              </>
            )}
          </p>
        ) : (
          <div
            role="group"
            aria-labelledby="kaya-types-label"
            className="grid grid-cols-2 gap-2.5 sm:grid-cols-3"
          >
            {options.map((kaya) => {
              const isOn = selected.has(kaya);
              return (
                <button
                  key={kaya}
                  type="button"
                  role="checkbox"
                  aria-checked={isOn}
                  onClick={() => toggle(kaya)}
                  className={cn(
                    "flex h-14 cursor-pointer items-center justify-between gap-2 rounded-2xl border-2 px-4 text-left transition",
                    "outline-none focus-visible:ring-4 focus-visible:ring-forest-200",
                    isOn
                      ? "border-forest-700 bg-forest-700 text-white"
                      : error
                        ? "border-red-300 bg-white text-sand-900 hover:border-forest-400"
                        : "border-sand-300 bg-white text-sand-900 hover:border-forest-400",
                  )}
                >
                  <span className="min-w-0 truncate text-[17px] font-semibold">{kaya}</span>
                  <span
                    className={cn(
                      "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2",
                      isOn ? "border-white bg-white text-forest-700" : "border-sand-300",
                    )}
                  >
                    {isOn && <Icon.Check className="h-4 w-4" strokeWidth={3} />}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {error ? (
          <span className="flex items-center gap-1.5 text-[14px] font-semibold text-red-600">
            <Icon.AlertCircle className="h-4 w-4" /> {error}
          </span>
        ) : (
          <span className="text-[13px] text-sand-600">Tap to select one or more</span>
        )}
      </div>
    </div>
  );
}
