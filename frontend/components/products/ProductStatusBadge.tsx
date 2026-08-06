import { StatusBadge } from "@/components/shared/StatusBadge";
import type { ProductStatus } from "@/types/product";

const TONE: Record<ProductStatus, "success" | "neutral"> = { active: "success", inactive: "neutral" };

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
