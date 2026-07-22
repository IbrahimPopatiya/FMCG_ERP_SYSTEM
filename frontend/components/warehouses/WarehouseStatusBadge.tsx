import { Badge } from "@/components/ui/Badge";
import type { WarehouseStatus } from "@/types/warehouses";

export function WarehouseStatusBadge({ status }: { status: WarehouseStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : "neutral"}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}
