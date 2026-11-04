"use client";

import { useMemo } from "react";
import { useAppData } from "@/src/store/data-context";
import { batchRemainingKolas } from "@/src/utils/calculations";
import { formatNumber } from "@/src/utils/format";
import { Icon } from "@/src/components/icons";

export function BatchPicker({
  value,
  onChange,
  excludeBatchId,
}: {
  value: string;
  onChange: (batchId: string) => void;
  /** when editing, the record's own batch may already be "closed" by its own quantity — still show it */
  excludeBatchId?: string;
}) {
  const { data } = useAppData();

  const options = useMemo(() => {
    return data.batches
      .map((batch) => {
        const broker = data.brokers.find((b) => b.id === batch.brokerId);
        const remaining = batchRemainingKolas(batch, data.distributions);
        const effectiveRemaining =
          batch.id === excludeBatchId ? remaining + 0 : remaining;
        return { batch, broker, remaining: effectiveRemaining };
      })
      .filter((o) => o.remaining > 0 || o.batch.id === excludeBatchId)
      .sort((a, b) => b.batch.date.localeCompare(a.batch.date));
  }, [data.batches, data.brokers, data.distributions, excludeBatchId]);

  return (
    <div>
      <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
        Stock Source (Broker Batch)<span className="ml-0.5 text-banana-600">*</span>
      </span>
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map(({ batch, broker, remaining }) => {
          const active = value === batch.id;
          return (
            <button
              key={batch.id}
              type="button"
              onClick={() => onChange(batch.id)}
              className={`flex items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left transition cursor-pointer ${
                active
                  ? "border-forest-500 bg-forest-50 ring-2 ring-forest-100"
                  : "border-sand-200 bg-white hover:border-forest-300"
              }`}
            >
              <div>
                <p className="text-[13.5px] font-semibold text-sand-900">
                  {broker?.name} <span className="text-sand-400">· {broker?.location}</span>
                </p>
                <p className="text-[12px] text-sand-500">
                  {batch.kayaType} · {formatNumber(remaining)} kolas remaining
                </p>
              </div>
              {active && (
                <Icon.Check className="h-4 w-4 shrink-0 text-forest-600" />
              )}
            </button>
          );
        })}
        {options.length === 0 && (
          <p className="col-span-2 rounded-xl border border-dashed border-sand-300 px-3.5 py-5 text-center text-[13px] text-sand-400">
            No active stock available. Record a broker consignment first.
          </p>
        )}
      </div>
    </div>
  );
}
