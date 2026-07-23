import { Badge } from "@/components/ui/Badge";
import type { PaymentRecordStatus } from "@/types/payments";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<PaymentRecordStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  cleared: "success",
  bounced: "danger",
};

export function PaymentRecordStatusBadge({ status }: { status: PaymentRecordStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
