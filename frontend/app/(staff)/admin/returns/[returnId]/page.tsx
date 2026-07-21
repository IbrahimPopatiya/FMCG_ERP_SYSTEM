"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { ReturnStatusBadge } from "@/components/returns/ReturnStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCreditNoteSample } from "@/lib/hooks/useCreditNotes";
import { useProducts } from "@/lib/hooks/useProducts";
import { useReturn } from "@/lib/hooks/useReturns";
import { useApproveReturn, useCompleteReturn, useRejectReturn } from "@/lib/hooks/useReturnMutations";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils/format";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This return's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function ReturnDetailPage() {
  const { returnId } = useParams<{ returnId: string }>();
  const ret = useReturn(returnId);
  const customer = useCustomer(ret.data?.customer_id ?? "");
  const products = useProducts();
  const warehouses = useWarehouses();
  const creditNotes = useCreditNoteSample();
  const approveReturn = useApproveReturn(returnId);
  const rejectReturn = useRejectReturn(returnId);
  const completeReturn = useCompleteReturn(returnId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmApprove, setConfirmApprove] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectError, setRejectError] = useState<string | null>(null);

  const productName = (productId: string) =>
    products.data?.find((p) => p.id === productId)?.name ?? "Product";
  const warehouseName = (warehouseId: string) =>
    warehouses.data?.find((w) => w.id === warehouseId)?.name ?? "—";
  const creditNote = creditNotes.data?.items.find((cn) => cn.return_id === returnId);

  async function handleApprove() {
    setActionError(null);
    try {
      await approveReturn.mutateAsync();
      setConfirmApprove(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmApprove(false);
    }
  }

  async function handleComplete() {
    setActionError(null);
    try {
      await completeReturn.mutateAsync();
      setConfirmComplete(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmComplete(false);
    }
  }

  async function handleReject() {
    if (!rejectReason.trim()) {
      setRejectError("Tell us why this return is being rejected.");
      return;
    }
    setRejectError(null);
    try {
      await rejectReturn.mutateAsync(rejectReason.trim());
      setShowReject(false);
      setRejectReason("");
    } catch (err) {
      setRejectError(actionErrorMessage(err));
    }
  }

  return (
    <div>
      <TopBar title="Return" />

      {ret.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {ret.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this return.
          </div>
        </div>
      )}

      {ret.data && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/admin/invoices/${ret.data.invoice_id}`}
                className="font-mono text-xs font-medium text-ink-muted hover:text-primary"
              >
                {ret.data.invoice_number}
              </Link>
              <h1 className="mt-1 text-lg font-semibold text-ink">
                {customer.data?.business_name ?? "Loading customer…"}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                Order {ret.data.order_number} · {formatDate(ret.data.created_at)}
              </p>
            </div>
            <ReturnStatusBadge status={ret.data.status} />
          </Card>

          <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Reason</span>
              <span className="text-sm font-medium text-ink">{toTitleCase(ret.data.reason)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Return to warehouse</span>
              <span className="text-sm font-medium text-ink">{warehouseName(ret.data.warehouse_id)}</span>
            </div>
          </div>

          {ret.data.remarks && (
            <Card>
              <p className="text-xs font-medium text-ink-muted">Remarks</p>
              <p className="mt-1 text-sm text-ink">{ret.data.remarks}</p>
            </Card>
          )}

          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-ink">Items</p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {ret.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <p className="text-sm text-ink">{productName(item.product_id)}</p>
                  <p className="text-sm font-medium text-ink">Qty {item.quantity}</p>
                </div>
              ))}
            </div>
          </div>

          {ret.data.status === "completed" && creditNote && (
            <Link href={`/admin/credit-notes/${creditNote.id}`} className="block">
              <Card className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-ink">Credit note issued</p>
                  <p className="text-xs text-ink-muted">{toTitleCase(creditNote.status)}</p>
                </div>
                <p className="text-sm font-semibold text-ink">{formatCurrency(creditNote.amount)}</p>
              </Card>
            </Link>
          )}

          {actionError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {actionError}
            </div>
          )}

          {ret.data.status === "requested" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowReject(true)}>
                Reject
              </Button>
              <Button
                type="button"
                isLoading={approveReturn.isPending}
                onClick={() => setConfirmApprove(true)}
              >
                Approve
              </Button>
            </div>
          )}

          {ret.data.status === "approved" && (
            <div className="flex justify-end">
              <Button
                type="button"
                isLoading={completeReturn.isPending}
                onClick={() => setConfirmComplete(true)}
              >
                Complete return
              </Button>
            </div>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmApprove}
        title="Approve return"
        message="This lets the warehouse process the return and issue a credit note once completed."
        confirmLabel="Approve"
        isConfirming={approveReturn.isPending}
        onConfirm={handleApprove}
        onCancel={() => setConfirmApprove(false)}
      />

      <ConfirmDialog
        open={confirmComplete}
        title="Complete return"
        message="This moves stock back into inventory and issues a credit note to the customer. This can't be undone."
        confirmLabel="Complete return"
        isConfirming={completeReturn.isPending}
        onConfirm={handleComplete}
        onCancel={() => setConfirmComplete(false)}
      />

      <Modal open={showReject} onClose={() => setShowReject(false)} title="Reject return">
        <div className="flex flex-col gap-4">
          <Input
            id="reject_reason"
            label="Reason"
            placeholder="e.g. Outside return window"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            required
          />
          {rejectError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {rejectError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowReject(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={rejectReturn.isPending} onClick={handleReject}>
              Reject return
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
