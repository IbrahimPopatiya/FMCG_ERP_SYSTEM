import { StatusBadge } from "@/components/shared/StatusBadge";
import type { PurchaseStatus } from "@/types/purchases";

const TONE: Record<PurchaseStatus, "neutral" | "success" | "warning" | "danger"> = {
  draft: "warning",
  received: "success",
  cancelled: "danger",
};

export function PurchaseStatusBadge({ status }: { status: PurchaseStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
