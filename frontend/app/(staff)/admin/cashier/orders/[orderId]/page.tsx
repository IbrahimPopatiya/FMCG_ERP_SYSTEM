"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { PaymentRecordStatusBadge } from "@/components/payments/PaymentRecordStatusBadge";
import { AlertTriangleIcon } from "@/components/cashier/icons";
import { useOrder } from "@/lib/hooks/useOrders";
import { useInvoiceSample } from "@/lib/hooks/useInvoices";
import { useCashierPaymentsSample } from "@/lib/hooks/useCashierCollections";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useVerifyPayment } from "@/lib/hooks/usePaymentMutations";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { PaymentListItem } from "@/types/payments";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function PaymentRow({ payment }: { payment: PaymentListItem }) {
  const verify = useVerifyPayment(payment.id);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-ink">{formatCurrency(payment.total_amount)}</p>
          <p className="text-xs text-ink-muted">{formatDate(payment.payment_date)}</p>
        </div>
        <PaymentRecordStatusBadge status={payment.status} />
      </div>
      <div className="grid grid-cols-3 gap-3 border-t border-border pt-3 text-sm">
        <div>
          <p className="text-ink-muted">Cash</p>
          <p className="font-medium text-ink">{formatCurrency(payment.cash_amount)}</p>
        </div>
        <div>
          <p className="text-ink-muted">UPI</p>
          <p className="font-medium text-ink">{formatCurrency(payment.upi_amount)}</p>
        </div>
        <div>
          <p className="text-ink-muted">Cheque</p>
          <p className="font-medium text-ink">{formatCurrency(payment.cheque_amount)}</p>
        </div>
      </div>
      {payment.status === "pending" && (
        <Button
          type="button"
          variant="secondary"
          className="w-full"
          isLoading={verify.isPending}
          onClick={() => verify.mutate()}
        >
          Approve payment
        </Button>
      )}
    </Card>
  );
}

export default function CashierOrderDetailPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const [notified, setNotified] = useState(false);

  const order = useOrder(orderId);
  const invoices = useInvoiceSample();
  const payments = useCashierPaymentsSample();

  const invoice = invoices.data?.items.find((inv) => inv.sales_order_id === orderId);
  const customer = useCustomer(order.data?.customer_id ?? "");

  const orderPayments = invoice
    ? (payments.data?.items ?? []).filter((p) => p.invoice_id === invoice.id)
    : [];
  const receivedTotal = orderPayments
    .filter((p) => p.status !== "bounced")
    .reduce((sum, p) => sum + p.total_amount, 0);
  const mismatch = invoice ? Math.round((receivedTotal - invoice.total) * 100) / 100 !== 0 : false;

  const isLoading = order.isLoading || invoices.isLoading;

  return (
    <div>
      <CashierTopBar title={order.data?.order_number ?? "Order"} back />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        {isLoading ? (
          <Skeleton className="h-28 w-full" />
        ) : !order.data ? (
          <Card className="text-sm text-ink-muted">Order not found.</Card>
        ) : (
          <Card>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-ink">{customer.data?.business_name ?? "Customer"}</p>
                <p className="font-mono text-xs text-ink-muted">{order.data.order_number}</p>
              </div>
              <OrderStatusBadge status={order.data.status} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 border-t border-border pt-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink-muted">Order Total</p>
                <p className="text-base font-semibold text-ink">{formatCurrency(order.data.total)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Received</p>
                <p className="text-base font-semibold text-ink">{formatCurrency(receivedTotal)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-muted">Invoice</p>
                <p className="text-base font-semibold text-ink">{invoice?.invoice_number ?? "Not generated"}</p>
              </div>
            </div>
          </Card>
        )}

        {invoice && mismatch && (
          <Card className="border-red-200 bg-red-50">
            <div className="flex items-start gap-3">
              <AlertTriangleIcon className="h-5 w-5 shrink-0 text-red-500" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700">Amount doesn&apos;t match the bill</p>
                <p className="mt-0.5 text-sm text-red-700/90">
                  Received {formatCurrency(receivedTotal)} against a bill of {formatCurrency(invoice.total)}.
                </p>
                {notified ? (
                  <p className="mt-3 text-sm font-medium text-red-700">Notification sent to customer.</p>
                ) : (
                  <Button
                    type="button"
                    variant="danger"
                    className="mt-3"
                    onClick={() => setNotified(true)}
                  >
                    Notify customer to confirm
                  </Button>
                )}
                <p className="mt-2 text-xs text-red-700/70">
                  Demo only — no message is actually sent yet; this needs a real notification system.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Payments</h2>
            {invoice && (
              <Link href="/admin/payments" className="text-sm font-medium text-primary hover:text-primary-hover">
                Record payment
              </Link>
            )}
          </div>

          {payments.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : !invoice ? (
            <Card className="text-sm text-ink-muted">
              No invoice generated for this order yet — payments can only be recorded against an invoice.
            </Card>
          ) : orderPayments.length === 0 ? (
            <Card className="text-sm text-ink-muted">No payments recorded against this invoice yet.</Card>
          ) : (
            <div className="flex flex-col gap-3">
              {orderPayments.map((p) => (
                <PaymentRow key={p.id} payment={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
