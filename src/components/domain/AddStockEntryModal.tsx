"use client";

import { useState } from "react";
import { useAppData } from "@/src/store/data-context";
import { Modal } from "@/src/components/ui/Modal";
import { Input, Select } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { Icon } from "@/src/components/icons";
import { KAYA_TYPES } from "@/src/utils/constants";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const emptyForm = {
  brokerId: "",
  newBrokerName: "",
  newBrokerLocation: "",
  newBrokerVehicle: "",
  newBrokerPhone: "",
  kayaType: KAYA_TYPES[0] as string,
  inwardQtyKolas: "",
  totalWeightKg: "",
  thanduPerKola: "",
  ratePerKola: "",
  date: "",
};

export function AddStockEntryModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { data, addBroker, addBatch } = useAppData();
  const [form, setForm] = useState(emptyForm);
  const [isNewBroker, setIsNewBroker] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setError(null);
  }

  function handleClose() {
    setForm(emptyForm);
    setIsNewBroker(false);
    setError(null);
    onClose();
  }

  function handleSubmit() {
    const inward = Number(form.inwardQtyKolas) || 0;
    const weight = Number(form.totalWeightKg) || 0;
    const thandu = Number(form.thanduPerKola) || 0;
    const rate = Number(form.ratePerKola) || 0;

    if (isNewBroker && !form.newBrokerName.trim()) {
      setError("Enter the broker's name");
      return;
    }
    if (!isNewBroker && !form.brokerId) {
      setError("Select a broker");
      return;
    }
    if (inward <= 0) {
      setError("Enter the inward kola quantity");
      return;
    }
    if (weight <= 0) {
      setError("Enter the total weight");
      return;
    }

    let brokerId = form.brokerId;
    if (isNewBroker) {
      const broker = addBroker({
        name: form.newBrokerName.trim(),
        location: form.newBrokerLocation.trim() || "—",
        vehicleNumber: form.newBrokerVehicle.trim() || "—",
        phone: form.newBrokerPhone.trim(),
      });
      brokerId = broker.id;
    }

    addBatch({
      brokerId,
      kayaType: form.kayaType,
      inwardQtyKolas: inward,
      totalWeightKg: weight,
      thanduPerKola: thandu || 1,
      ratePerKola: rate,
      date: new Date(form.date || todayISO()).toISOString(),
      status: "active",
    });

    handleClose();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Record Inward Stock" widthClassName="max-w-lg">
      <div className="space-y-4">
        <div className="flex rounded-xl border border-sand-200 bg-sand-50 p-1">
          <button
            type="button"
            onClick={() => setIsNewBroker(false)}
            className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition cursor-pointer ${
              !isNewBroker ? "bg-white text-forest-800 shadow-soft" : "text-sand-500"
            }`}
          >
            Existing Broker
          </button>
          <button
            type="button"
            onClick={() => setIsNewBroker(true)}
            className={`flex-1 rounded-lg py-2 text-[12.5px] font-semibold transition cursor-pointer ${
              isNewBroker ? "bg-white text-forest-800 shadow-soft" : "text-sand-500"
            }`}
          >
            New Broker
          </button>
        </div>

        {!isNewBroker ? (
          <Select
            label="Broker"
            required
            value={form.brokerId}
            onChange={(e) => set("brokerId", e.target.value)}
          >
            <option value="">Select broker…</option>
            {data.brokers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} — {b.location}
              </option>
            ))}
          </Select>
        ) : (
          <div className="space-y-3">
            <Input
              label="Broker Name"
              required
              placeholder="e.g. Muthu Bananas"
              value={form.newBrokerName}
              onChange={(e) => set("newBrokerName", e.target.value)}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Market / District"
                placeholder="e.g. Theni"
                value={form.newBrokerLocation}
                onChange={(e) => set("newBrokerLocation", e.target.value)}
              />
              <Input
                label="Vehicle / Lorry No."
                placeholder="TN 00 XX 0000"
                value={form.newBrokerVehicle}
                onChange={(e) => set("newBrokerVehicle", e.target.value)}
              />
            </div>
          </div>
        )}

        <Select
          label="Kaya Type"
          required
          value={form.kayaType}
          onChange={(e) => set("kayaType", e.target.value)}
        >
          {KAYA_TYPES.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Inward Quantity"
            required
            type="number"
            min={0}
            placeholder="Kolas"
            value={form.inwardQtyKolas}
            onChange={(e) => set("inwardQtyKolas", e.target.value)}
          />
          <Input
            label="Total Weight"
            required
            type="number"
            min={0}
            prefix="kg"
            value={form.totalWeightKg}
            onChange={(e) => set("totalWeightKg", e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Thandu / Kola"
            type="number"
            min={0}
            value={form.thanduPerKola}
            onChange={(e) => set("thanduPerKola", e.target.value)}
          />
          <Input
            label="Broker Rate / Kola"
            type="number"
            min={0}
            prefix="₹"
            value={form.ratePerKola}
            onChange={(e) => set("ratePerKola", e.target.value)}
          />
        </div>

        <Input
          label="Arrival Date"
          type="date"
          value={form.date}
          onChange={(e) => set("date", e.target.value)}
        />

        {error && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
            <Icon.AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        <Button className="w-full" onClick={handleSubmit}>
          <Icon.Check className="h-4 w-4" /> Save Consignment
        </Button>
      </div>
    </Modal>
  );
}
