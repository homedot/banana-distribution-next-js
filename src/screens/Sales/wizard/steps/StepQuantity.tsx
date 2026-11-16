"use client";

import { QUALITY_CATEGORIES } from "@/src/utils/constants";
import { Input } from "@/src/components/ui/Field";
import { Dropdown } from "@/src/components/ui/Dropdown";
import type { WizardState } from "@/src/screens/Sales/wizard/types";
import type { QualityCategory } from "@/src/types";

export function StepQuantity({
  state,
  update,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
}) {
  return (
    <div className="space-y-5">
      <Dropdown<QualityCategory>
        label="Quality Category"
        required
        value={state.qualityCategory}
        options={QUALITY_CATEGORIES.map((q) => ({ value: q, label: q }))}
        onChange={(qualityCategory) => update({ qualityCategory })}
      />

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
