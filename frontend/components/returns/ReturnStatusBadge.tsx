import { Badge } from "@/components/ui/Badge";
import type { ReturnStatus } from "@/types/returns";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<ReturnStatus, "neutral" | "success" | "warning" | "danger"> = {
  requested: "warning",
  approved: "neutral",
  completed: "success",
  rejected: "danger",
};

export function ReturnStatusBadge({ status }: { status: ReturnStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
