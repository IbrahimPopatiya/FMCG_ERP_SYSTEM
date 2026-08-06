import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PaymentRecordStatus } from "@/types/payments";

const TONE: Record<PaymentRecordStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  cleared: "success",
  bounced: "danger",
};

export function PaymentRecordStatusBadge({ status }: { status: PaymentRecordStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
