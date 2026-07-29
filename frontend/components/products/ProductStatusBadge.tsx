import { Badge } from "@/components/ui/Badge";
import type { ProductStatus } from "@/types/product";

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return (
    <Badge tone={status === "active" ? "success" : "neutral"}>
      {status === "active" ? "Active" : "Inactive"}
    </Badge>
  );
}
