import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/salesOrder";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "neutral",
  loaded: "neutral",
  delivered: "success",
  cancelled: "danger",
};

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
