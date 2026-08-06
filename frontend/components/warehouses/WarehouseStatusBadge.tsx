import { StatusBadge } from "@/components/shared/StatusBadge";
import type { WarehouseStatus } from "@/types/warehouses";

const TONE: Record<WarehouseStatus, "success" | "neutral"> = { active: "success", inactive: "neutral" };

export function WarehouseStatusBadge({ status }: { status: WarehouseStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
