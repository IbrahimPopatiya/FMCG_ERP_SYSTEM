import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

type Tone = "neutral" | "warning" | "danger" | "success";

const VALUE_TONE: Record<Tone, string> = {
  neutral: "text-ink",
  warning: "text-amber-600",
  danger: "text-red-600",
  success: "text-primary",
};

export function StatCard({
  label,
  value,
  hint,
  isLoading,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  isLoading?: boolean;
  tone?: Tone;
}) {
  return (
    <Card className="flex flex-col gap-1.5 rounded-2xl">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className={`text-2xl font-semibold tracking-tight ${VALUE_TONE[tone]}`}>{value}</p>
      )}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}
