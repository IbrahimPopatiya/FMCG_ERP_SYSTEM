import { Badge } from "@/components/ui/Badge";
import type { CustomerStatus } from "@/types/customers";

const LABEL: Record<CustomerStatus, string> = {
  active: "Active",
  inactive: "Inactive",
  blocked: "Blocked",
};

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : status === "blocked" ? "danger" : "neutral"}>
      {LABEL[status]}
    </Badge>
  );
}
