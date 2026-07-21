"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { PaymentRecordStatusBadge } from "@/components/payments/PaymentRecordStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { usePayment } from "@/lib/hooks/usePayments";
import { useBouncePayment, useVerifyPayment } from "@/lib/hooks/usePaymentMutations";
import { formatCurrency, formatDate } from "@/lib/utils/format";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This payment's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function PaymentDetailPage() {
  const { paymentId } = useParams<{ paymentId: string }>();
  const payment = usePayment(paymentId);
  const customer = useCustomer(payment.data?.customer_id ?? "");
  const verifyPayment = useVerifyPayment(paymentId);
  const bouncePayment = useBouncePayment(paymentId);

  const [actionError, setActionError] = useState<string | null>(null);
  const [showBounce, setShowBounce] = useState(false);
  const [reason, setReason] = useState("");
  const [bounceError, setBounceError] = useState<string | null>(null);

  async function handleVerify() {
    setActionError(null);
    try {
      await verifyPayment.mutateAsync();
    } catch (err) {
      setActionError(actionErrorMessage(err));
    }
  }

  async function handleBounce() {
    if (!reason.trim()) {
      setBounceError("Tell us why this payment bounced.");
      return;
    }
    setBounceError(null);
    try {
      await bouncePayment.mutateAsync(reason.trim());
      setShowBounce(false);
      setReason("");
    } catch (err) {
      setBounceError(actionErrorMessage(err));
    }
  }

  return (
    <div>
      <TopBar title="Payment" />

      {payment.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {payment.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this payment.
          </div>
        </div>
      )}

      {payment.data && (
        <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 sm:p-6">
          <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <Link
                href={`/admin/invoices/${payment.data.invoice_id}`}
                className="font-mono text-xs font-medium text-ink-muted hover:text-primary"
              >
                {payment.data.invoice_number}
              </Link>
              <h1 className="mt-1 text-lg font-semibold text-ink">
                {customer.data?.business_name ?? "Loading customer…"}
              </h1>
              <p className="mt-0.5 text-sm text-ink-muted">
                Order {payment.data.order_number} · {formatDate(payment.data.payment_date)}
              </p>
            </div>
            <PaymentRecordStatusBadge status={payment.data.status} />
          </Card>

          <Card className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Cash</span>
              <span>{formatCurrency(payment.data.cash_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>UPI</span>
              <span>{formatCurrency(payment.data.upi_amount)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Cheque</span>
              <span>{formatCurrency(payment.data.cheque_amount)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(payment.data.total_amount)}</span>
            </div>
          </Card>

          {payment.data.reference_number && (
            <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-ink-muted">Reference number</p>
              <p className="mt-1 text-sm text-ink">{payment.data.reference_number}</p>
            </div>
          )}

          {actionError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {actionError}
            </div>
          )}

          {payment.data.status === "pending" && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setShowBounce(true)}>
                Mark as bounced
              </Button>
              <Button type="button" isLoading={verifyPayment.isPending} onClick={handleVerify}>
                Verify payment
              </Button>
            </div>
          )}
        </div>
      )}

      <Modal open={showBounce} onClose={() => setShowBounce(false)} title="Mark payment as bounced">
        <div className="flex flex-col gap-4">
          <Input
            id="bounce_reason"
            label="Reason"
            placeholder="e.g. Cheque returned by bank"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          />
          {bounceError && (
            <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
              {bounceError}
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setShowBounce(false)}>
              Cancel
            </Button>
            <Button type="button" variant="danger" isLoading={bouncePayment.isPending} onClick={handleBounce}>
              Mark as bounced
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
