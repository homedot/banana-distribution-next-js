"use client";

import { useRef, useState } from "react";
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
  ACCOUNT_NUMBER_PATTERN,
  emptyWizardState,
  IFSC_PATTERN,
  paymentDetailsForMethod,
  UPI_ID_PATTERN,
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
    title: "Vendor & Kaya Types",
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
      if (!state.vendorId) return "Select a vendor to continue";
      if (state.kayaTypes.length === 0) return "Select at least one kaya type to continue";
      return null;
    case 1: {
      const qty = Number(state.kolaQuantity) || 0;
      const weight = Number(state.totalWeight) || 0;
      if (qty <= 0) return "Enter the kola quantity";
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
      const d = state.paymentDetails;
      if (state.paymentMethod === "upi") {
        const upiId = d.upiId.trim();
        if (collected > 0 && !upiId)
          return "Enter the UPI ID the payment came from";
        if (upiId && !UPI_ID_PATTERN.test(upiId))
          return "Enter a valid UPI ID (e.g. name@okaxis)";
      }
      if (state.paymentMethod === "bank_transfer") {
        if (collected > 0 && !d.bankName.trim())
          return "Enter the bank name for the transfer";
        if (collected > 0 && !d.bankReference.trim())
          return "Enter the UTR / reference number for the transfer";
        const acc = d.accountNumber.replace(/\s+/g, "");
        if (acc && !ACCOUNT_NUMBER_PATTERN.test(acc))
          return "Account number should be 9–18 digits";
        const ifsc = d.ifscCode.trim().toUpperCase();
        if (ifsc && !IFSC_PATTERN.test(ifsc))
          return "Enter a valid IFSC code (e.g. SBIN0001234)";
      }
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
  const router = useRouter();
  const { data, addSale, updateSale } = useAppData();
  const existing = saleId ? data.sales.find((d) => d.id === saleId) : undefined;

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
      batchId: state.batchId || null,
      kayaTypes: state.kayaTypes,
      kayaType: state.kayaTypes.join(", "),
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
                />
              )}
              {i === 1 && <StepQuantity state={state} update={update} />}
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
