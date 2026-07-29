import { Badge } from "@/components/ui/Badge";
import type { PaymentStatus } from "@/types/invoices";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<PaymentStatus, "neutral" | "success" | "warning" | "danger"> = {
  unpaid: "warning",
  partial: "neutral",
  paid: "success",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
