import { Badge } from "@/components/ui/Badge";
import type { CreditNoteStatus } from "@/types/creditNotes";
import { toTitleCase } from "@/lib/utils/format";

const TONE: Record<CreditNoteStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function CreditNoteStatusBadge({ status }: { status: CreditNoteStatus }) {
  return <Badge tone={TONE[status]}>{toTitleCase(status)}</Badge>;
}
