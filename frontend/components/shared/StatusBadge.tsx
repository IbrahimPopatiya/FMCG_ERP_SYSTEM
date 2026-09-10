import { Badge } from "@/components/ui/Badge";
import { toTitleCase } from "@/lib/utils/format";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "purple";

export function StatusBadge<T extends string>({
  status,
  toneMap,
  labelMap,
  size,
}: {
  status: T;
  toneMap: Record<T, Tone>;
  labelMap?: Record<T, string>;
  size?: "xs" | "sm";
}) {
  return (
    <Badge tone={toneMap[status]} size={size}>
      {labelMap?.[status] ?? toTitleCase(status)}
    </Badge>
  );
}
