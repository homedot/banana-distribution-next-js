"use client";

import { VendorPicker } from "@/src/components/domain/VendorPicker";
import { BatchPicker } from "@/src/components/domain/BatchPicker";
import { Input } from "@/src/components/ui/Field";
import { Icon } from "@/src/components/icons";
import type { WizardState } from "@/src/screens/Distributions/wizard/types";
import type { BrokerBatch } from "@/src/types";

export function StepVendorStock({
  state,
  update,
  editingBatchId,
}: {
  state: WizardState;
  update: (patch: Partial<WizardState>) => void;
  editingBatchId?: string;
}) {
  function handleBatchChange(batch: BrokerBatch | null) {
    update({
      batchId: batch?.id ?? "",
      kayaType: batch?.kayaType ?? "",
      dailySellingRate:
        state.dailySellingRate || (batch ? String(batch.ratePerKola + 6) : ""),
    });
  }

  return (
    <div className="space-y-6">
      <VendorPicker value={state.vendorId} onChange={(vendorId) => update({ vendorId })} />

      <BatchPicker
        value={state.batchId}
        onChange={handleBatchChange}
        excludeBatchId={editingBatchId}
      />

      <Input
        label="Kaya Type"
        value={state.kayaType}
        readOnly
        disabled
        hint="Automatically locked based on the chosen batch"
        prefix={<Icon.Banana className="h-4 w-4" />}
      />
    </div>
  );
}
