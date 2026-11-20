"use client";

import { QUALITY_CATEGORIES } from "@/src/utils/constants";
import { Input } from "@/src/components/ui/Field";
import { Dropdown } from "@/src/components/ui/Dropdown";
import { formatNumber } from "@/src/utils/format";
import {
  kayaQuality,
  saleTotals,
  type WizardState,
} from "@/src/screens/Sales/wizard/types";
import type { QualityCategory } from "@/src/types";

export function StepQuantity({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  const { kolas: totalKolas, weight: totalWeight } = saleTotals(state);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-sand-700">
            Quantity, Weight &amp; Quality per Kaya
          </span>
          {state.kayaTypes.length > 1 && (
            <span className="text-[13px] text-sand-500">
              Total:{" "}
              <span className="font-bold text-sand-900">
                {formatNumber(totalKolas)} kolas · {formatNumber(totalWeight, 2)} kg
              </span>
            </span>
          )}
        </div>

        {state.kayaTypes.length === 0 ? (
          <p className="rounded-xl bg-sand-50 px-3.5 py-3 text-[13px] text-sand-500">
            Select kaya types above to enter a quantity, weight and quality for each.
          </p>
        ) : (
          <div className="space-y-3">
            {state.kayaTypes.map((kaya) => (
              <div
                key={kaya}
                className="space-y-3 rounded-2xl border border-sand-200 p-4"
              >
                <p className="text-[15px] font-bold text-sand-900">{kaya}</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <Input
                    label="Kola Quantity"
                    required
                    type="number"
                    min={0}
                    inputMode="numeric"
                    unit="kolas"
                    placeholder="e.g. 120"
                    value={state.kayaQuantities[kaya] ?? ""}
                    onChange={(e) =>
                      update({
                        kayaQuantities: {
                          ...state.kayaQuantities,
                          [kaya]: e.target.value,
                        },
                      })
                    }
                  />
                  <Input
                    label="Weight"
                    required
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 900"
                    unit="kg"
                    value={state.kayaWeights[kaya] ?? ""}
                    onChange={(e) =>
                      update({
                        kayaWeights: {
                          ...state.kayaWeights,
                          [kaya]: e.target.value,
                        },
                      })
                    }
                  />
                  <Dropdown<QualityCategory>
                    label="Quality Category"
                    required
                    value={kayaQuality(state, kaya)}
                    options={QUALITY_CATEGORIES.map((q) => ({ value: q, label: q }))}
                    onChange={(quality) =>
                      update({
                        kayaQualities: { ...state.kayaQualities, [kaya]: quality },
                      })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      <Input
        label="Thandu Count"
        required
        type="number"
        min={0}
        inputMode="numeric"
        unit="thandu"
        placeholder="e.g. 900"
        hint="Total hands/stems counted across bunches"
        value={state.thanduCount}
        onChange={(e) => update({ thanduCount: e.target.value })}
      />
    </div>
  );
}
