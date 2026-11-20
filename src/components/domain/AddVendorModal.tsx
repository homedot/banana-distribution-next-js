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

type FormState = typeof emptyForm;

function formFor(vendor?: Vendor | null): FormState {
  if (!vendor) return emptyForm;
  return {
    name: vendor.name,
    contactPerson: vendor.contactPerson ?? "",
    phone: vendor.phone ?? "",
    location: vendor.location,
  };
}

/**
 * Add a new vendor, or edit an existing one when `vendor` is passed.
 */
export function VendorFormModal({
  open,
  onClose,
  onCreated,
  onSaved,
  vendor,
}: {
  open: boolean;
  onClose: () => void;
  /** Called after a new vendor is added. */
  onCreated?: (vendor: Vendor) => void;
  /** Called after an edit is saved. */
  onSaved?: (vendor: Vendor) => void;
  /** The vendor to edit. Omit to add a new vendor. */
  vendor?: Vendor | null;
}) {
  const [saving, setSaving] = useState(false);

  function handleClose() {
    if (!saving) onClose();
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={vendor ? "Edit Customer" : "Add Customer"}
      widthClassName="max-w-lg"
    >
      {/* Mounted only while open, so the form starts fresh every time. */}
      <VendorForm
        key={vendor?.id ?? "new"}
        vendor={vendor}
        saving={saving}
        setSaving={setSaving}
        onCancel={handleClose}
        onDone={(saved) => {
          if (vendor) onSaved?.(saved);
          else onCreated?.(saved);
          onClose();
        }}
      />
    </Modal>
  );
}

/** Kept for existing callers — same as `<VendorFormModal>` without `vendor`. */
export const AddVendorModal = VendorFormModal;

function VendorForm({
  vendor,
  saving,
  setSaving,
  onCancel,
  onDone,
}: {
  vendor?: Vendor | null;
  saving: boolean;
  setSaving: (v: boolean) => void;
  onCancel: () => void;
  onDone: (vendor: Vendor) => void;
}) {
  const { data, addVendor, updateVendor } = useAppData();
  const [form, setForm] = useState<FormState>(() => formFor(vendor));
  const [nameError, setNameError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const editing = Boolean(vendor);
  const unchanged =
    editing &&
    (Object.keys(form) as (keyof FormState)[]).every(
      (k) => form[k].trim() === formFor(vendor)[k].trim(),
    );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const name = form.name.trim();
    if (!name) {
      setNameError("Shop / customer name is required");
      return;
    }
    const duplicate = data.vendors.some(
      (v) =>
        v.id !== vendor?.id &&
        v.name.trim().toLowerCase() === name.toLowerCase() &&
        v.location === form.location,
    );
    if (duplicate) {
      setNameError(`A customer named "${name}" already exists in ${form.location}`);
      return;
    }
    setNameError(null);
    setError(null);
    setSaving(true);
    const input = {
      name,
      contactPerson: form.contactPerson.trim(),
      phone: form.phone.trim(),
      location: form.location,
    };
    try {
      const saved = vendor ? await updateVendor(vendor.id, input) : await addVendor(input);
      onDone(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : editing ? "Failed to update customer" : "Failed to add customer",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Shop / Customer Name"
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
          {/* An edited vendor may be in an area no longer in the list — keep it selectable. */}
          {[...new Set<string>([...SERVICE_AREAS, form.location])].map((area) => (
            <button
              type="button"
              key={area}
              onClick={() => update("location", area)}
              className={cn(
                "flex h-10 items-center gap-1.5 rounded-xl px-3.5 text-[13px] font-semibold transition cursor-pointer",
                form.location === area
                  ? "bg-forest-700 text-white"
                  : "bg-sand-100 text-sand-600 hover:bg-sand-200",
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
        <Button variant="secondary" onClick={onCancel} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving || unchanged}>
          <Icon.Check className="h-4 w-4" />
          {saving ? "Saving…" : editing ? "Save changes" : "Save customer"}
        </Button>
      </div>
    </form>
  );
}
