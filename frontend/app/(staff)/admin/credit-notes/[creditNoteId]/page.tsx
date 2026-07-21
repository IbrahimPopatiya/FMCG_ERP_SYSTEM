"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { CreditNoteStatusBadge } from "@/components/creditNotes/CreditNoteStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCreditNote } from "@/lib/hooks/useCreditNotes";
import { useApproveCreditNote, useRejectCreditNote } from "@/lib/hooks/useCreditNoteMutations";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 403) {
    return "Only the customer's route salesman or an admin may act on this credit note.";
  }
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This credit note's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function CreditNoteDetailPage() {
  const { creditNoteId } = useParams<{ creditNoteId: string }>();
  const creditNote = useCreditNote(creditNoteId);
  const customer = useCustomer(creditNote.data?.customer_id ?? "");
  const approveCreditNote = useApproveCreditNote(creditNoteId);
  const rejectCreditNote = useRejectCreditNote(creditNoteId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmReject, setConfirmReject] = useState(false);

  async function handleApprove() {
    setActionError(null);
    try {
      await approveCreditNote.mutateAsync();
      setConfirmApprove(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmApprove(false);
    }
  }

  async function handleReject() {
    setActionError(null);
    try {
      await rejectCreditNote.mutateAsync();
      setConfirmReject(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmReject(false);
    }
  }

  return (
    <div>
      <TopBar title="Credit Note" />

      {creditNote.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {creditNote.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this credit note.
          </div>
        </div>
      )}

      {creditNote.data && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/admin/returns/${creditNote.data.return_id}`}
                className="text-xs font-medium text-ink-muted hover:text-primary"
              >
                View originating return
              </Link>
              <h1 className="mt-1 text-lg font-semibold text-ink">
                {customer.data?.business_name ?? "Loading customer…"}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">Issued {formatDate(creditNote.data.created_at)}</p>
            </div>
            <CreditNoteStatusBadge status={creditNote.data.status} />
          </Card>

          <Card className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Amount owed to customer</span>
            <span className="text-lg font-semibold text-ink">{formatCurrency(creditNote.data.amount)}</span>
          </Card>

          {actionError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {actionError}
            </div>
          )}

          {creditNote.data.status === "pending" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setConfirmReject(true)}>
                Reject
              </Button>
              <Button type="button" onClick={() => setConfirmApprove(true)}>
                Approve
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmApprove}
        title="Approve credit note"
        message="This confirms the amount owed back to the customer."
        confirmLabel="Approve"
        isConfirming={approveCreditNote.isPending}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmDialog
        open={confirmReject}
        title="Reject credit note"
        message="This marks the credit note as rejected. The customer will not be credited."
        confirmLabel="Reject"
        tone="danger"
        isConfirming={rejectCreditNote.isPending}
        onConfirm={handleReject}
        onCancel={() => setConfirmReject(false)}
      />
    </div>
  );
}
