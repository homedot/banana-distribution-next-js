import type { Sale } from "@/src/types";
import { paymentStatus } from "@/src/utils/calculations";
import { Badge } from "@/src/components/ui/Badge";

const config = {
  paid: { tone: "success" as const, label: "Paid" },
  partial: { tone: "warning" as const, label: "Partial" },
  pending: { tone: "danger" as const, label: "Pending" },
};

export function PaymentStatusBadge({ sale }: { sale: Sale }) {
  const status = paymentStatus(sale);
  const { tone, label } = config[status];
  return (
    <Badge tone={tone} dot>
      {label}
    </Badge>
  );
}
