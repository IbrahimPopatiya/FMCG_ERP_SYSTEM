import { Badge } from "@/components/ui/Badge";
import { toTitleCase } from "@/lib/utils/format";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "purple";

export function StatusBadge<T extends string>({
  status,
  toneMap,
  labelMap,
}: {
  status: T;
  toneMap: Record<T, Tone>;
  labelMap?: Record<T, string>;
}) {
  return <Badge tone={toneMap[status]}>{labelMap?.[status] ?? toTitleCase(status)}</Badge>;
}
