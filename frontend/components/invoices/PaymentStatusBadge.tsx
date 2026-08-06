import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PaymentStatus } from "@/types/invoices";

const TONE: Record<PaymentStatus, "neutral" | "success" | "warning" | "danger"> = {
  unpaid: "warning",
  partial: "neutral",
  paid: "success",
};

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
