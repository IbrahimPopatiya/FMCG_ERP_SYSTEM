import { Badge } from "@/components/ui/Badge";
import type { SupplierStatus } from "@/types/suppliers";

export function SupplierStatusBadge({ status }: { status: SupplierStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : "neutral"}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}
