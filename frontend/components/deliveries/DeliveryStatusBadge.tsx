import { Badge } from "@/components/ui/Badge";
import type { DeliveryStatus } from "@/types/deliveries";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<DeliveryStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  out_for_delivery: "neutral",
  delivered: "success",
  failed: "danger",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
