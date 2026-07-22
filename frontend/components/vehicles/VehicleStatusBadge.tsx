import { Badge } from "@/components/ui/Badge";
import type { VehicleStatus } from "@/types/vehicles";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<VehicleStatus, "neutral" | "success" | "warning" | "danger"> = {
  available: "success",
  in_use: "neutral",
  maintenance: "warning",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
