import { StatusBadge } from "@/components/shared/StatusBadge";
import type { SupplierStatus } from "@/types/suppliers";

const TONE: Record<SupplierStatus, "success" | "neutral"> = { active: "success", inactive: "neutral" };

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
