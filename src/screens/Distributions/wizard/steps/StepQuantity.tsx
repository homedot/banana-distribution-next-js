"use client";

import { useAppData } from "@/src/store/data-context";
import { batchRemainingKolas } from "@/src/utils/calculations";
import { formatNumber } from "@/src/utils/format";
import { QUALITY_CATEGORIES } from "@/src/utils/constants";
import { Input, Select } from "@/src/components/ui/Field";
import { Icon } from "@/src/components/icons";
import type { WizardState } from "@/src/screens/Distributions/wizard/types";
import type { QualityCategory } from "@/src/types";

export function StepQuantity({
  state,
  update,
  originalKolaQuantity,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  originalKolaQuantity?: number;
}) {
  const { data } = useAppData();
  const batch = data.batches.find((b) => b.id === state.batchId);
  const remaining = batch
    ? batchRemainingKolas(batch, data.distributions) + (originalKolaQuantity ?? 0)
    : 0;

  const requested = Number(state.kolaQuantity) || 0;
  const overAllocated = batch ? requested > remaining : false;

  return (
    <div className="space-y-5">
      {batch && (
        <div className="flex items-center gap-2 rounded-xl bg-forest-50 px-3.5 py-2.5 text-[12.5px] font-medium text-forest-700">
          <Icon.Package className="h-4 w-4" />
          {formatNumber(remaining)} kolas available from this batch
        </div>
      )}

      <Select
        label="Quality Category"
        required
        value={state.qualityCategory}
        onChange={(e) =>
          update({ qualityCategory: e.target.value as QualityCategory })
        }
      >
        {QUALITY_CATEGORIES.map((q) => (
          <option key={q} value={q}>
            {q}
          </option>
        ))}
      </Select>

      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Kola Quantity"
          required
          type="number"
          min={0}
          inputMode="numeric"
          placeholder="e.g. 120"
          value={state.kolaQuantity}
          onChange={(e) => update({ kolaQuantity: e.target.value })}
          error={overAllocated ? `Only ${formatNumber(remaining)} kolas remaining` : undefined}
        />
        <Input
          label="Total Weight"
          required
          type="number"
          min={0}
          step="0.01"
          placeholder="e.g. 1800"
          value={state.totalWeight}
          onChange={(e) => update({ totalWeight: e.target.value })}
          prefix="kg"
        />
      </div>

      <Input
        label="Thandu Count"
        required
        type="number"
        min={0}
        inputMode="numeric"
        hint="Total hands/stems counted across bunches"
        value={state.thanduCount}
        onChange={(e) => update({ thanduCount: e.target.value })}
      />
    </div>
  );
}
