import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CustomerStatus } from "@/types/customers";

const TONE: Record<CustomerStatus, "success" | "danger" | "neutral"> = {
  active: "success",
  blocked: "danger",
  inactive: "neutral",
};

const LABEL: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return <StatusBadge status={status} toneMap={TONE} labelMap={LABEL} />;
}
