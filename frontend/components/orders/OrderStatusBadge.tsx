import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/salesOrder";
import { toTitleCase } from "@/lib/utils/format";

// Colors per the reference mockup: pending=amber, approved="confirmed"=blue,
// loaded="processing"=purple, delivered=green, cancelled=red.
const TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger" | "info" | "purple"> = {
  pending: "warning",
  approved: "info",
  loaded: "purple",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
