import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ReturnStatus } from "@/types/returns";

const TONE: Record<ReturnStatus, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "neutral",
  completed: "success",
  rejected: "danger",
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
