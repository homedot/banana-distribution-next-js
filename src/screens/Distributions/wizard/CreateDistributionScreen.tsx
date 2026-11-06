"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/src/store/data-context";
import {
  calcBalanceDue,
  calcGrossTotal,
  calcNetPayable,
} from "@/src/utils/calculations";
import { formatCurrency } from "@/src/utils/format";
import { cn } from "@/src/utils/cn";
import { Button } from "@/src/components/ui/Button";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Icon } from "@/src/components/icons";
import {
  emptyWizardState,
  wizardStateFromDistribution,
  type WizardState,
} from "@/src/screens/Distributions/wizard/types";
import { StepVendorStock } from "@/src/screens/Distributions/wizard/steps/StepVendorStock";
import { StepQuantity } from "@/src/screens/Distributions/wizard/steps/StepQuantity";
import { StepPricing } from "@/src/screens/Distributions/wizard/steps/StepPricing";
import { StepPayment } from "@/src/screens/Distributions/wizard/steps/StepPayment";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

const SECTIONS = [
  {
    title: "Vendor & Stock",
    description: "Who this dispatch is for, and which batch it draws from.",
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

function validateStep(index: number, state: WizardState, remaining: number): string | null {
  switch (index) {
    case 0:
      if (!state.vendorId) return "Select a vendor to continue";
      if (!state.batchId) return "Select a stock source to continue";
      return null;
    case 1: {
      const qty = Number(state.kolaQuantity) || 0;
      const weight = Number(state.totalWeight) || 0;
      if (qty <= 0) return "Enter the kola quantity";
      if (qty > remaining) return "Kola quantity exceeds remaining stock";
      if (weight <= 0) return "Enter the total weight";
      return null;
    }
    case 2: {
      const rate = Number(state.dailySellingRate) || 0;
      if (rate <= 0) return "Enter the daily selling rate";
      return null;
    }
    case 3: {
      const collected = Number(state.amountCollected) || 0;
      if (collected < 0) return "Amount collected cannot be negative";
      return null;
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
          status === "neutral" && "bg-sand-100 text-sand-500"
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

export function CreateDistributionScreen({
  distributionId,
}: {
  distributionId?: string;
}) {
  const router = useRouter();
  const { data, addDistribution, updateDistribution } = useAppData();
  const existing = distributionId
    ? data.distributions.find((d) => d.id === distributionId)
    : undefined;

  const [state, setState] = useState<WizardState>(() =>
    existing ? wizardStateFromDistribution(existing) : emptyWizardState
  );
  const [attempted, setAttempted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sectionRefs = useRef<Array<HTMLDivElement | null>>([]);

  const batch = data.batches.find((b) => b.id === state.batchId);
  const remaining = useMemo(() => {
    if (!batch) return 0;
    const dispatched = data.distributions
      .filter((d) => d.batchId === batch.id && d.id !== existing?.id)
      .reduce((s, d) => s + d.kolaQuantity, 0);
    return Math.max(0, batch.inwardQtyKolas - dispatched);
  }, [batch, data.distributions, existing?.id]);

  const sectionErrors = [0, 1, 2, 3].map((i) => validateStep(i, state, remaining));

  function sectionStatus(i: number): "ok" | "error" | "neutral" {
    if (!sectionErrors[i]) return "ok";
    return attempted ? "error" : "neutral";
  }

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
    setError(null);
  }

  const rate = Number(state.dailySellingRate) || 0;
  const weight = Number(state.totalWeight) || 0;
  const kolas = Number(state.kolaQuantity) || 0;
  const discount = Number(state.discount) || 0;
  const collected = Number(state.amountCollected) || 0;

  const grossTotal = calcGrossTotal(state.rateBasis, rate, weight, kolas);
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
      batchId: state.batchId,
      kayaType: state.kayaType,
      qualityCategory: state.qualityCategory,
      kolaQuantity: kolas,
      totalWeight: weight,
      thanduCount: thandu,
      rateBasis: state.rateBasis,
      dailySellingRate: rate,
      grossTotal,
      discount,
      netPayable,
      amountCollected: collected,
      paymentMethod: state.paymentMethod,
      balanceDue,
      customFields: state.customFields.filter((f) => f.label.trim()),
      notes: state.notes,
      date: new Date(state.date || todayISO()).toISOString(),
    };

    try {
      if (existing) {
        await updateDistribution(existing.id, payload);
        router.push(`/distributions/${existing.id}`);
      } else {
        const created = await addDistribution(payload);
        router.push(`/distributions/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save distribution");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-6">
      <Link
        href={existing ? `/distributions/${existing.id}` : "/distributions"}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
      >
        <Icon.ArrowLeft className="h-4 w-4" />
        {existing ? "Back to distribution" : "Back to distributions"}
      </Link>

      <div>
        <h1 className="text-[20px] font-extrabold text-sand-900">
          {existing ? "Edit Distribution" : "New Distribution"}
        </h1>
        <p className="text-[13px] text-sand-500">
          Everything is on this one screen — fill it in, in any order.
        </p>
      </div>

      {SECTIONS.map((section, i) => (
        <div key={section.title} ref={(el) => { sectionRefs.current[i] = el; }}>
          <Card>
            <CardBody className="space-y-5">
              <SectionHeader
                number={i + 1}
                title={section.title}
                description={section.description}
                status={sectionStatus(i)}
              />
              {i === 0 && (
                <StepVendorStock
                  state={state}
                  update={update}
                  editingBatchId={existing?.batchId}
                />
              )}
              {i === 1 && (
                <StepQuantity
                  state={state}
                  update={update}
                  originalKolaQuantity={existing?.kolaQuantity}
                />
              )}
              {i === 2 && <StepPricing state={state} update={update} />}
              {i === 3 && <StepPayment state={state} update={update} />}
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
                    balanceDue > 0 ? "text-red-700" : "text-emerald-700"
                  )}
                >
                  {balanceDue > 0 ? formatCurrency(balanceDue) : "Fully Settled"}
                </p>
              </div>
            </div>
            <Button size="lg" onClick={handleSave}>
              <Icon.Check className="h-4 w-4" />
              {existing ? "Save Changes" : "Save Distribution"}
            </Button>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
