"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/src/store/data-context";
import {
  calcBalanceDue,
  calcGrossTotal,
  calcNetPayable,
} from "@/src/utils/calculations";
import { Button } from "@/src/components/ui/Button";
import { Card, CardBody } from "@/src/components/ui/Card";
import { Stepper } from "@/src/components/ui/Stepper";
import { Icon } from "@/src/components/icons";
import {
  WIZARD_STEPS,
  emptyWizardState,
  wizardStateFromDistribution,
  type WizardState,
} from "@/src/screens/Distributions/wizard/types";
import { StepVendorStock } from "@/src/screens/Distributions/wizard/steps/StepVendorStock";
import { StepQuantity } from "@/src/screens/Distributions/wizard/steps/StepQuantity";
import { StepPricing } from "@/src/screens/Distributions/wizard/steps/StepPricing";
import { StepPayment } from "@/src/screens/Distributions/wizard/steps/StepPayment";
import { StepReview } from "@/src/screens/Distributions/wizard/steps/StepReview";

function todayISO() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  return new Date(d.getTime() - offset * 60000).toISOString().slice(0, 10);
}

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
      if (!state.date) return "Pick a dispatch date";
      const collected = Number(state.amountCollected) || 0;
      if (collected < 0) return "Amount collected cannot be negative";
      return null;
    }
    default:
      return null;
  }
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
  const [stepIndex, setStepIndex] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const batch = data.batches.find((b) => b.id === state.batchId);
  const remaining = useMemo(() => {
    if (!batch) return 0;
    const dispatched = data.distributions
      .filter((d) => d.batchId === batch.id && d.id !== existing?.id)
      .reduce((s, d) => s + d.kolaQuantity, 0);
    return Math.max(0, batch.inwardQtyKolas - dispatched);
  }, [batch, data.distributions, existing?.id]);

  function update(patch: Partial<WizardState>) {
    setState((s) => ({ ...s, ...patch }));
    setError(null);
  }

  function goTo(index: number) {
    setStepIndex(index);
    setError(null);
  }

  function handleNext() {
    const err = validateStep(stepIndex, state, remaining);
    if (err) {
      setError(err);
      return;
    }
    const next = Math.min(stepIndex + 1, WIZARD_STEPS.length - 1);
    setStepIndex(next);
    setMaxReached((m) => Math.max(m, next));
    setError(null);
    if (next === 3 && !state.date) {
      setState((s) => ({ ...s, date: todayISO() }));
    }
  }

  function handleBack() {
    setStepIndex((i) => Math.max(0, i - 1));
    setError(null);
  }

  function handleSave() {
    for (let i = 0; i < 4; i += 1) {
      const err = validateStep(i, state, remaining);
      if (err) {
        setStepIndex(i);
        setError(err);
        return;
      }
    }

    const rate = Number(state.dailySellingRate) || 0;
    const weight = Number(state.totalWeight) || 0;
    const kolas = Number(state.kolaQuantity) || 0;
    const thandu = Number(state.thanduCount) || 0;
    const discount = Number(state.discount) || 0;
    const collected = Number(state.amountCollected) || 0;

    const grossTotal = calcGrossTotal(state.rateBasis, rate, weight, kolas);
    const netPayable = calcNetPayable(grossTotal, discount);
    const balanceDue = calcBalanceDue(netPayable, collected);

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
      date: new Date(state.date).toISOString(),
    };

    if (existing) {
      updateDistribution(existing.id, payload);
      router.push(`/distributions/${existing.id}`);
    } else {
      const created = addDistribution(payload);
      router.push(`/distributions/${created.id}`);
    }
  }

  const isLast = stepIndex === WIZARD_STEPS.length - 1;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <Link
        href={existing ? `/distributions/${existing.id}` : "/distributions"}
        className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-sand-500 hover:text-sand-800"
      >
        <Icon.ArrowLeft className="h-4 w-4" />
        {existing ? "Back to distribution" : "Back to distributions"}
      </Link>

      <Card>
        <CardBody className="space-y-6">
          <Stepper
            steps={WIZARD_STEPS}
            currentIndex={stepIndex}
            maxReachedIndex={maxReached}
            onStepClick={goTo}
          />

          <div>
            {stepIndex === 0 && (
              <StepVendorStock
                state={state}
                update={update}
                editingBatchId={existing?.batchId}
              />
            )}
            {stepIndex === 1 && (
              <StepQuantity
                state={state}
                update={update}
                originalKolaQuantity={existing?.kolaQuantity}
              />
            )}
            {stepIndex === 2 && <StepPricing state={state} update={update} />}
            {stepIndex === 3 && <StepPayment state={state} update={update} />}
            {stepIndex === 4 && (
              <StepReview state={state} onEditStep={goTo} />
            )}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-[13px] font-medium text-red-700">
              <Icon.AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between border-t border-sand-100 pt-5">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={stepIndex === 0}
            >
              <Icon.ArrowLeft className="h-4 w-4" /> Back
            </Button>

            {isLast ? (
              <Button onClick={handleSave}>
                <Icon.Check className="h-4 w-4" />
                {existing ? "Save Changes" : "Save Distribution"}
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next <Icon.ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
