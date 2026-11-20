"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useAppData } from "@/src/store/data-context";
import { Card, CardBody, CardHeader, CardTitle } from "@/src/components/ui/Card";
import { Input } from "@/src/components/ui/Field";
import { Button } from "@/src/components/ui/Button";
import { Modal } from "@/src/components/ui/Modal";
import { EmptyState } from "@/src/components/ui/EmptyState";
import { Icon } from "@/src/components/icons";
import { formatNumber } from "@/src/utils/format";
import type { KayaType } from "@/src/types";

export function KolaCategoriesScreen() {
  const { data, loading, addKayaType, deleteKayaType } = useAppData();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const [removing, setRemoving] = useState<KayaType | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);

  // How many sales use each category (sales store the name).
  const usage = useMemo(() => {
    const counts = new Map<string, number>();
    for (const sale of data.sales) {
      const kayas = sale.kayaTypes?.length ? sale.kayaTypes : sale.kayaType ? [sale.kayaType] : [];
      for (const k of kayas) counts.set(k, (counts.get(k) ?? 0) + 1);
    }
    return counts;
  }, [data.sales]);

  async function handleAdd(e: FormEvent) {
    e.preventDefault();
    if (saving) return;
    const trimmed = name.trim().replace(/\s+/g, " ");
    if (!trimmed) {
      setError("Enter a kola category name");
      return;
    }
    const key = trimmed.toLocaleLowerCase();
    if (data.kayaTypes.some((k) => k.name.toLocaleLowerCase() === key)) {
      setError(`"${trimmed}" is already in the list`);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await addKayaType(trimmed);
      setName("");
      setJustAdded(created.name);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't add the category");
    } finally {
      setSaving(false);
    }
  }

  async function confirmRemove() {
    if (!removing || removeBusy) return;
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await deleteKayaType(removing.id);
      if (justAdded === removing.name) setJustAdded(null);
      setRemoving(null);
    } catch (err) {
      setRemoveError(err instanceof Error ? err.message : "Couldn't remove the category");
    } finally {
      setRemoveBusy(false);
    }
  }

  const removingUses = removing ? (usage.get(removing.name) ?? 0) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Add Kola Category</CardTitle>
            <p className="mt-0.5 text-[12.5px] text-sand-500">
              New categories appear right away in New Sale → Kaya Types.
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-3">
          <form onSubmit={handleAdd} className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <div className="flex-1">
              <Input
                label="Category name"
                required
                maxLength={60}
                placeholder="e.g. ചെങ്കദളി"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                  setJustAdded(null);
                }}
                error={error ?? undefined}
              />
            </div>
            <Button type="submit" size="lg" disabled={saving} className="sm:mt-[26px]">
              <Icon.Plus className="h-[18px] w-[18px]" />
              {saving ? "Adding…" : "Add Category"}
            </Button>
          </form>
          {justAdded && (
            <p className="mt-3 flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-2.5 text-[13px] font-semibold text-emerald-700">
              <Icon.Check className="h-4 w-4" />
              &ldquo;{justAdded}&rdquo; added — it&apos;s now available in New Sale.
            </p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Kola Categories</CardTitle>
            <p className="mt-0.5 text-[12.5px] text-sand-500">
              {loading
                ? "Loading…"
                : `${data.kayaTypes.length} ${data.kayaTypes.length === 1 ? "category" : "categories"}`}
            </p>
          </div>
        </CardHeader>
        <CardBody className="pt-2">
          {!loading && data.kayaTypes.length === 0 ? (
            <EmptyState
              icon={<Icon.Banana className="h-6 w-6" />}
              title="No kola categories yet"
              description="Add one above so it can be picked on New Sale."
            />
          ) : (
            <ul className="divide-y divide-sand-100">
              {data.kayaTypes.map((k) => {
                const uses = usage.get(k.name) ?? 0;
                return (
                  <li key={k.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-banana-50 text-banana-700">
                        <Icon.Banana className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-bold text-sand-900">{k.name}</p>
                        <p className="text-[12px] text-sand-500">
                          {uses === 0
                            ? "Not used in any sale yet"
                            : `Used in ${formatNumber(uses)} ${uses === 1 ? "sale" : "sales"}`}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setRemoveError(null);
                        setRemoving(k);
                      }}
                      aria-label={`Remove ${k.name}`}
                    >
                      <Icon.Trash className="h-3.5 w-3.5" />
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </CardBody>
      </Card>

      <Modal
        open={removing !== null}
        onClose={() => !removeBusy && setRemoving(null)}
        title="Remove kola category?"
      >
        <p className="text-[15px] leading-relaxed text-sand-700">
          <span className="font-bold text-sand-900">{removing?.name}</span> will no longer be offered
          on New Sale.
          {removingUses > 0 &&
            ` The ${formatNumber(removingUses)} ${
              removingUses === 1 ? "sale that uses" : "sales that use"
            } it keep their records unchanged.`}
        </p>
        {removeError && (
          <p className="mt-4 rounded-xl bg-red-50 px-3.5 py-2.5 text-[14px] font-semibold text-red-700">
            {removeError}
          </p>
        )}
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={() => setRemoving(null)}
            disabled={removeBusy}
          >
            Keep
          </Button>
          <Button
            size="lg"
            onClick={confirmRemove}
            disabled={removeBusy}
            className="bg-red-600 text-white hover:bg-red-700 active:bg-red-800"
          >
            <Icon.Trash className="h-4 w-4" />
            {removeBusy ? "Removing…" : "Remove"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
