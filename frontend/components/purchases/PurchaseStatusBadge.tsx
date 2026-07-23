import { Badge } from "@/components/ui/Badge";
import type { PurchaseStatus } from "@/types/purchases";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<PurchaseStatus, "neutral" | "success" | "warning" | "danger"> = {
  draft: "warning",
  received: "success",
  cancelled: "danger",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
