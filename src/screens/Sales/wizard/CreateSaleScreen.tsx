"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/src/store/data-context";
import {
  calcBalanceDue,
  calcNetPayable,
} from "@/src/utils/calculations";
import { formatCurrency } from "@/src/utils/format";
import { cn } from "@/src/utils/cn";
import { Button } from "@/src/components/ui/Button";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import type { Sale } from "@/src/types";
import {
  emptyWizardState,
  paymentDetailsForMethod,
  paymentFieldErrors,
  overallQuality,
  saleTotals,
  wizardStateFromSale,
  type WizardState,
} from "@/src/screens/Sales/wizard/types";
import { StepVendorKaya } from "@/src/screens/Sales/wizard/steps/StepVendorKaya";
import { StepQuantity } from "@/src/screens/Sales/wizard/steps/StepQuantity";
import { StepPricing } from "@/src/screens/Sales/wizard/steps/StepPricing";
import { StepPayment } from "@/src/screens/Sales/wizard/steps/StepPayment";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const SECTIONS = [
  {
    title: "Customer & Kaya Types",
    description: "Who this sale is for, and which kaya types.",
  },
  {
    title: "Quantity & Quality",
    description: "How much is going out, and its grade.",
  },
  {
    title: "Pricing",
    description: "Today's rate, and any discount to apply.",
  },
  {
    title: "Payment & Extras",
    description: "What's collected now, and anything else worth noting.",
  },
] as const;

function validateStep(index: number, state: WizardState): string | null {
  switch (index) {
    case 0:
      if (!state.vendorId) return "Select a customer to continue";
      if (state.kayaTypes.length === 0)
        return "Select at least one kaya type to continue";
      return null;
    case 1: {
      if (state.kayaTypes.length === 0)
        return "Select a kaya type to enter its kola quantity";
      const positive = (v: string | undefined) => (Number(v) || 0) > 0;
      for (const k of state.kayaTypes) {
        if (!positive(state.kayaQuantities[k]))
          return `Enter the kola quantity for ${k}`;
        if (!positive(state.kayaWeights[k])) return `Enter the weight for ${k}`;
      }
      const thandu = Number(state.thanduWeight) || 0;
      if (thandu < 0) return "Thandu weight can't be negative";
      const { grossWeight } = saleTotals(state);
      if (thandu >= grossWeight)
        return "Thandu weight must be less than the total kola weight";
      return null;
    }
    case 2: {
      if (state.kayaTypes.length === 0)
        return "Select a kaya type to enter its selling rate";
      const noRate = state.kayaTypes.find(
        (k) => !((Number(state.kayaRates[k]) || 0) > 0),
      );
      if (noRate) return `Enter the selling rate for ${noRate}`;
      return null;
    }
    case 3: {
      const errors = paymentFieldErrors(state);
      return Object.values(errors).find(Boolean) ?? null;
    }
    default:
      return null;
  }
}

function SectionHeader({
  number,
  title,
  description,
  status,
}: {
  number: number;
  title: string;
  description: string;
  status: "ok" | "error" | "neutral";
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-bold",
          status === "ok" && "bg-forest-100 text-forest-700",
          status === "error" && "bg-red-100 text-red-700",
          status === "neutral" && "bg-sand-100 text-sand-500",
        )}
      >
        {status === "ok" ? (
          <Icon.Check className="h-4 w-4" />
        ) : status === "error" ? (
          <Icon.AlertCircle className="h-4 w-4" />
        ) : (
          number
        )}
      </span>
      <div>
        <h2 className="text-[15px] font-bold text-sand-900">{title}</h2>
        <p className="text-[12.5px] text-sand-500">{description}</p>
      </div>
    </div>
  );
}

export function CreateSaleScreen({ saleId }: { saleId?: string }) {
  const { bfcacheId } = useRouter();
  const { data, loading } = useAppData();
  const existing = saleId ? data.sales.find((d) => d.id === saleId) : undefined;

  // Editing, but the sales haven't loaded yet (or the id is wrong): wait,
  // rather than starting an empty form that would never fill in.
  if (saleId && !existing) {
    return (
      <div className="mx-auto max-w-3xl space-y-5 pb-6">
        <Link
          href="/distributions"
          className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
        >
          <Icon.ArrowLeft className="h-4 w-4" />
          Back to Sales
        </Link>
        <Card>
          <CardBody className="py-10 text-center text-[14px] text-sand-500">
            {loading ? "Loading sale…" : "This sale could not be found."}
          </CardBody>
        </Card>
      </div>
    );
  }

  // The form is filled in once, when it mounts. Next.js keeps visited pages
  // alive between visits, so without a key a second "Edit" of the same sale
  // would reopen the old form (pre-save values, e.g. the old date) and a
  // second "New Sale" would still hold the last sale. bfcacheId changes on
  // every fresh visit and stays the same for browser back/forward.
  return <SaleForm key={`${bfcacheId}:${existing?.id ?? "new"}`} existing={existing} />;
}

function SaleForm({ existing }: { existing?: Sale }) {
  const router = useRouter();
  const { addSale, updateSale } = useAppData();

  const [state, setState] = useState<WizardState>(() =>
    existing ? wizardStateFromSale(existing) : emptyWizardState,
  );
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const sectionErrors = [0, 1, 2, 3].map((i) => validateStep(i, state));

  function sectionStatus(i: number): "ok" | "error" | "neutral" {
    if (!sectionErrors[i]) return "ok";
    return attempted ? "error" : "neutral";
  }

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
    setError(null);
  }

  const { lines, kolas, weight, thanduWeight, grossTotal, averageRate } = saleTotals(state);
  const discount = Number(state.discount) || 0;
  const collected = Number(state.amountCollected) || 0;

  const netPayable = calcNetPayable(grossTotal, discount);
  const balanceDue = calcBalanceDue(netPayable, collected);

  async function handleSave() {
    setAttempted(true);
    const firstInvalid = sectionErrors.findIndex((e) => e !== null);
    if (firstInvalid !== -1) {
      setError(sectionErrors[firstInvalid]!);
      sectionRefs.current[firstInvalid]?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    }
    setError(null);

    const thandu = Number(state.thanduCount) || 0;

    const payload = {
      vendorId: state.vendorId,
      batchId: state.batchId || null,
      kayaTypes: state.kayaTypes,
      kayaType: state.kayaTypes.join(", "),
      kayaItems: lines.map((l) => ({
        kayaType: l.kayaType,
        kolaQuantity: l.kolaQuantity,
        qualityCategory: l.qualityCategory,
        totalWeight: l.totalWeight,
        sellingRate: l.sellingRate,
      })),
      qualityCategory: overallQuality(state),
      kolaQuantity: kolas,
      totalWeight: weight,
      thanduCount: thandu,
      thanduWeight,
      rateBasis: state.rateBasis,
      dailySellingRate: averageRate,
      grossTotal,
      discount,
      netPayable,
      amountCollected: collected,
      paymentMethod: state.paymentMethod,
      paymentDetails: paymentDetailsForMethod(
        state.paymentMethod,
        state.paymentDetails,
      ),
      balanceDue,
      customFields: state.customFields.filter((f) => f.label.trim()),
      notes: state.notes,
      date: new Date(state.date || todayISO()).toISOString(),
    };

    try {
      if (existing) {
        await updateSale(existing.id, payload);
        router.push(`/distributions/${existing.id}`);
      } else {
        const created = await addSale(payload);
        router.push(`/distributions/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save Sale");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <Link
        href={existing ? `/distributions/${existing.id}` : "/distributions"}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
      >
        <Icon.ArrowLeft className="h-4 w-4" />
        {existing ? "Back to Sale" : "Back to Sales"}
      </Link>

      <div>
        <h1 className="text-[20px] font-extrabold text-sand-900">
          {existing ? "Edit Sale" : "New Sale"}
        </h1>
        <p className="text-[13px] text-sand-500">
          Everything is on this one screen — fill it in, in any order.
        </p>
      </div>

      {SECTIONS.map((section, i) => (
        <div
          key={section.title}
          ref={(el) => {
            sectionRefs.current[i] = el;
          }}
        >
          <Card>
            <CardBody className="space-y-5">
              <SectionHeader
                number={i + 1}
                title={section.title}
                description={section.description}
                status={sectionStatus(i)}
              />
              {i === 0 && (
                <StepVendorKaya
                  state={state}
                  update={update}
                  showErrors={attempted}
                  editingSaleId={existing?.id}
                />
              )}
              {i === 1 && <StepQuantity state={state} update={update} />}
              {i === 2 && <StepPricing state={state} update={update} />}
              {i === 3 && (
                <StepPayment
                  state={state}
                  update={update}
                  showErrors={attempted}
                />
              )}
            </CardBody>
          </Card>
        </div>
      ))}

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
          <Icon.AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="sticky bottom-4 z-10">
        <Card className="shadow-lg">
          <CardBody className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sand-400">
                  Net Payable
                </p>
                <p className="text-[17px] font-extrabold text-sand-900">
                  {formatCurrency(netPayable)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-sand-400">
                  {balanceDue > 0 ? "Balance Due" : "Status"}
                </p>
                <p
                  className={cn(
                    "text-[17px] font-extrabold",
                    balanceDue > 0 ? "text-red-700" : "text-emerald-700",
                  )}
                >
                  {balanceDue > 0
                    ? formatCurrency(balanceDue)
                    : "Fully Settled"}
                </p>
              </div>
            </div>
            <Button size="lg" onClick={handleSave}>
              <Icon.Check className="h-4 w-4" />
              {existing ? "Save Changes" : "Save Sale"}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
