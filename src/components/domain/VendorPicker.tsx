"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Vendor } from "@/src/types";
import { useAppData } from "@/src/store/data-context";
import { Icon } from "@/src/components/icons";
import { initials } from "@/src/utils/format";

export function VendorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (vendorId: string) => void;
}) {
  const { data } = useAppData();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const selected = data.vendors.find((v) => v.id === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data.vendors;
    return data.vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.location.toLowerCase().includes(q)
    );
  }, [data.vendors, query]);

  function selectVendor(v: Vendor) {
    onChange(v.id);
    setOpen(false);
    setQuery("");
  }

  return (
    <div className="relative" ref={wrapRef}>
      <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
        Shopkeeper / Customer Name<span className="ml-0.5 text-banana-600">*</span>
      </span>

      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-full items-center justify-between rounded-xl border border-sand-200 bg-white px-3.5 h-11 text-left text-[14px] transition hover:border-forest-300 cursor-pointer"
        >
          {selected ? (
            <span className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest-100 text-[10px] font-bold text-forest-700">
                {initials(selected.name)}
              </span>
              <span className="font-medium text-sand-900">{selected.name}</span>
              <span className="text-xs text-sand-400">{selected.location}</span>
            </span>
          ) : (
            <span className="text-sand-400">Search or select a customer…</span>
          )}
          <Icon.ChevronDown className="h-4 w-4 text-sand-400" />
        </button>
      )}

      {open && (
        <div className="absolute z-20 mt-1 w-full rounded-xl border border-sand-200 bg-white shadow-lift">
          <div className="flex items-center gap-2 border-b border-sand-100 px-3 py-2.5">
            <Icon.Search className="h-4 w-4 shrink-0 text-sand-400" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a shop name…"
              className="w-full text-[14px] outline-none placeholder:text-sand-400"
            />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-sand-400 hover:text-sand-700 cursor-pointer"
            >
              <Icon.X className="h-4 w-4" />
            </button>
          </div>

          <div className="max-h-56 overflow-y-auto scrollbar-thin py-1">
            {filtered.length === 0 && (
              <p className="px-3.5 py-3 text-[13px] text-sand-400">
                No customers match &ldquo;{query}&rdquo;. Use{" "}
                <span className="font-semibold text-sand-600">Customers</span> in the
                menu to add one.
              </p>
            )}
            {filtered.map((v) => (
              <button
                key={v.id}
                type="button"
                onClick={() => selectVendor(v)}
                className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left hover:bg-sand-50 cursor-pointer"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-forest-100 text-[11px] font-bold text-forest-700">
                  {initials(v.name)}
                </span>
                <span className="flex-1">
                  <span className="block text-[13.5px] font-medium text-sand-900">
                    {v.name}
                  </span>
                  <span className="block text-[11.5px] text-sand-400">{v.location}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
