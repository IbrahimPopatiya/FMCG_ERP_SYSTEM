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

// Display labels only - the underlying status values (pending/approved/loaded)
// stay as-is everywhere else (DB, API, business logic).
const LABEL: Record<OrderStatus, string> = {
  pending: "Order Placed",
  approved: "Out for Delivery",
  loaded: "Completed",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{LABEL[status] ?? toTitleCase(status)}</Badge>;
}
