"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { batchRemainingKolas } from "@/src/utils/calculations";
import { formatNumber } from "@/src/utils/format";
import { Select } from "@/src/components/ui/Field";
import { Icon } from "@/src/components/icons";
import { AddStockEntryModal } from "@/src/components/domain/AddStockEntryModal";
import type { BrokerBatch } from "@/src/types";

export function BatchPicker({
  value,
  onChange,
  excludeBatchId,
}: {
  value: string;
  // Passes the full batch (not just its id) so callers never have to look it
  // back up in `data.batches` — see the `onCreated` note below for why that
  // lookup isn't reliable right after a batch is created inline.
  onChange: (batch: BrokerBatch | null) => void;
  /** when editing, the record's own batch may already be "closed" by its own quantity — still show it */
  excludeBatchId?: string;
}) {
  const { data } = useAppData();
  const [showAddModal, setShowAddModal] = useState(false);

  const options = useMemo(() => {
    return data.batches
      .map((batch) => {
        const broker = data.brokers.find((b) => b.id === batch.brokerId);
        const remaining = batchRemainingKolas(batch, data.distributions);
        return { batch, broker, remaining };
      })
      .filter((o) => o.remaining > 0 || o.batch.id === excludeBatchId)
      .sort((a, b) => b.batch.date.localeCompare(a.batch.date));
  }, [data.batches, data.brokers, data.distributions, excludeBatchId]);

  function handleSelectChange(batchId: string) {
    const found = data.batches.find((b) => b.id === batchId) ?? null;
    onChange(found);
  }

  return (
    <div>
      <Select
        label="Stock Source (Broker Batch)"
        required
        value={value}
        onChange={(e) => handleSelectChange(e.target.value)}
        hint={
          options.length === 0
            ? "No active stock yet — record one below."
            : undefined
        }
      >
        <option value="">Select active incoming stock…</option>
        {options.map(({ batch, broker, remaining }) => (
          <option key={batch.id} value={batch.id}>
            {broker?.name} ({broker?.location}) - {batch.kayaType} ·{" "}
            {formatNumber(remaining)} kolas left
          </option>
        ))}
      </Select>

      <button
        type="button"
        onClick={() => setShowAddModal(true)}
        className="mt-1.5 flex items-center gap-1.5 text-[12.5px] font-semibold text-forest-700 hover:text-forest-800 cursor-pointer"
      >
        <Icon.Plus className="h-3.5 w-3.5" />
        Record new inward stock
      </button>

      <AddStockEntryModal
        open={showAddModal}
        onClose={() => setShowAddModal(false)}
        // `addBatch` resolves (and we get `batch` here) before React has
        // re-rendered this component with the updated `data.batches`, so
        // looking the new batch back up by id here would still miss it.
        // Pass the object straight through instead.
        onCreated={(batch) => onChange(batch)}
      />
    </div>
  );
}
