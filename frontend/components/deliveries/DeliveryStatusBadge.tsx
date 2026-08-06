import { StatusBadge } from "@/components/shared/StatusBadge";
import type { DeliveryStatus } from "@/types/deliveries";

const TONE: Record<DeliveryStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  out_for_delivery: "neutral",
  delivered: "success",
  failed: "danger",
};

export function DeliveryStatusBadge({ status }: { status: DeliveryStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
