"use client";

import { useState, type FormEvent } from "react";
import type { Vendor } from "@/src/types";
import { useAppData } from "@/src/store/data-context";
import { SERVICE_AREAS } from "@/src/utils/constants";
import { cn } from "@/src/utils/cn";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { Icon } from "@/src/components/icons";

const emptyForm = {
  name: "",
  contactPerson: "",
  phone: "",
  location: SERVICE_AREAS[0] as string,
};

export function AddVendorModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated?: (vendor: Vendor) => void;
}) {
  const { data, addVendor } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleClose() {
    if (saving) return;
    setForm(emptyForm);
    setNameError(null);
    setError(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setNameError("Shop / vendor name is required");
      return;
    }
    const duplicate = data.vendors.some(
      (v) => v.name.trim().toLowerCase() === name.toLowerCase() && v.location === form.location
    );
    if (duplicate) {
      setNameError(`A vendor named "${name}" already exists in ${form.location}`);
      return;
    }
    setNameError(null);
    setError(null);
    setSaving(true);
    try {
      const vendor = await addVendor({
        name,
        contactPerson: form.contactPerson.trim(),
        phone: form.phone.trim(),
        location: form.location,
      });
      setForm(emptyForm);
      onCreated?.(vendor);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add vendor");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={handleClose} title="Add Vendor" widthClassName="max-w-lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Shop / Vendor Name"
          required
          autoFocus
          placeholder="e.g. Joseph Fruit Stall"
          value={form.name}
          error={nameError ?? undefined}
          onChange={(e) => {
            update("name", e.target.value);
            if (nameError) setNameError(null);
          }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Contact Person"
            placeholder="Owner or manager"
            value={form.contactPerson}
            onChange={(e) => update("contactPerson", e.target.value)}
          />
          <Input
            label="Phone"
            type="tel"
            inputMode="tel"
            placeholder="98xxxxxxxx"
            value={form.phone}
            onChange={(e) => update("phone", e.target.value)}
          />
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-semibold text-sand-700">
            Location<span className="ml-0.5 text-banana-600">*</span>
          </span>
          <div className="flex flex-wrap gap-2">
            {SERVICE_AREAS.map((area) => (
              <button
                type="button"
                key={area}
                onClick={() => update("location", area)}
                className={cn(
                  "flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition cursor-pointer",
                  form.location === area
                    ? "bg-forest-700 text-white"
                    : "bg-sand-100 text-sand-600 hover:bg-sand-200"
                )}
              >
                <Icon.MapPin className="h-4 w-4" />
                {area}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="flex items-center gap-1.5 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            <Icon.AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}

        <div className="flex justify-end gap-2.5 pt-1">
          <Button variant="secondary" onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            <Icon.Check className="h-4 w-4" />
            {saving ? "Saving…" : "Save vendor"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
