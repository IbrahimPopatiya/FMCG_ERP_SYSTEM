import { StatusBadge } from "@/components/shared/StatusBadge";
import type { CreditNoteStatus } from "@/types/creditNotes";

const TONE: Record<CreditNoteStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export function CreditNoteStatusBadge({ status }: { status: CreditNoteStatus }) {
  return <StatusBadge status={status} toneMap={TONE} />;
}
