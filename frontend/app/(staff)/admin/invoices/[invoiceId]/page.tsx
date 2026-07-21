"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { PaymentStatusBadge } from "@/components/invoices/PaymentStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useInvoice } from "@/lib/hooks/useInvoices";
import { useCancelInvoice } from "@/lib/hooks/useInvoiceMutations";
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils/format";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "Only unpaid invoices can be cancelled.";
  }
  return "Something went wrong. Please try again.";
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const invoice = useInvoice(invoiceId);
  const customer = useCustomer(invoice.data?.customer_id ?? "");
  const cancelInvoice = useCancelInvoice(invoiceId);

  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCancel() {
    if (!reason.trim()) {
      setError("Tell us why this invoice is being cancelled.");
      return;
    }
    setError(null);
    try {
      await cancelInvoice.mutateAsync(reason.trim());
      setShowCancel(false);
      setReason("");
    } catch (err) {
      setError(actionErrorMessage(err));
    }
  }

  return (
    <div>
      <TopBar title="Invoice" />

      {invoice.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {invoice.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this invoice.
          </div>
        </div>
      )}

      {invoice.data && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-xs font-medium text-ink-muted">{invoice.data.invoice_number}</p>
              <h1 className="mt-1 text-lg font-semibold text-ink">
                {customer.data?.business_name ?? "Loading customer…"}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                Order {invoice.data.order_number} · {formatDate(invoice.data.invoice_date)}
              </p>
            </div>
            <PaymentStatusBadge status={invoice.data.payment_status} />
          </Card>

          <div className="divide-y divide-border rounded-lg border border-border bg-white shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Place of supply</span>
              <span className="text-sm font-medium text-ink">{invoice.data.place_of_supply}</span>
            </div>
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ink-muted">Tally sync</span>
              <span className="text-sm font-medium text-ink">{toTitleCase(invoice.data.tally_sync_status)}</span>
            </div>
          </div>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(invoice.data.subtotal)}</span>
            </div>
            {invoice.data.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Discount</span>
                <span>−{formatCurrency(invoice.data.discount)}</span>
              </div>
            )}
            {invoice.data.cgst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>CGST</span>
                <span>{formatCurrency(invoice.data.cgst)}</span>
              </div>
            )}
            {invoice.data.sgst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>SGST</span>
                <span>{formatCurrency(invoice.data.sgst)}</span>
              </div>
            )}
            {invoice.data.igst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>IGST</span>
                <span>{formatCurrency(invoice.data.igst)}</span>
              </div>
            )}
            {invoice.data.round_off !== 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Round off</span>
                <span>{formatCurrency(invoice.data.round_off)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(invoice.data.total)}</span>
            </div>
          </Card>

          {invoice.data.payment_status === "unpaid" && (
            <div className="flex justify-end">
              <Button type="button" variant="danger" onClick={() => setShowCancel(true)}>
                Cancel invoice
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel invoice">
        <div className="flex flex-col gap-4">
          <Input
            id="cancel_reason"
            label="Reason"
            placeholder="e.g. Order cancelled by customer"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          {error && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowCancel(false)}>
              Keep invoice
            </Button>
            <Button type="button" variant="danger" isLoading={cancelInvoice.isPending} onClick={handleCancel}>
              Cancel invoice
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
