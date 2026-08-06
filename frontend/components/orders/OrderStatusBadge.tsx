import { StatusBadge } from "@/components/shared/StatusBadge";
import type { OrderStatus } from "@/types/salesOrder";

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
  return <StatusBadge status={status} toneMap={TONE} labelMap={LABEL} />;
}
