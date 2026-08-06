import { StatusBadge } from "@/components/shared/StatusBadge";
import type { VehicleStatus } from "@/types/vehicles";

const TONE: Record<VehicleStatus, "neutral" | "success" | "warning" | "danger"> = {
  available: "success",
  in_use: "neutral",
  maintenance: "warning",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
