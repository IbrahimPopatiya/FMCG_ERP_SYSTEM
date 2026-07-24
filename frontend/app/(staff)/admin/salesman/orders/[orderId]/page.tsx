"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { useOrder } from "@/lib/hooks/useOrders";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDuesById";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderStatus } from "@/types/salesOrder";

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "neutral",
  loaded: "neutral",
  delivered: "success",
  cancelled: "danger",
};

const TIMELINE_STEPS: OrderStatus[] = ["pending", "approved", "loaded", "delivered"];

export default function OrderDetailsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const { orderId } = useParams<{ orderId: string }>();
  const searchParams = useSearchParams();
  const justPlaced = searchParams.get("justPlaced") === "1";

  const order = useOrder(orderId);
  const customer = useCustomer(order.data?.customer_id ?? "");
  const dues = useCustomerDuesById(order.data?.customer_id ?? "");

  if (order.isLoading) {
    return (
      <div className="p-4">
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!order.data) {
    return (
      <div>
        <SalesmanTopBar title="Order" back hideAlerts />
        <p className="p-6 text-sm text-ink-muted">Order not found.</p>
      </div>
    );
  }

  const o = order.data;
  const relatedInvoice = dues.data?.invoices.find((inv) => inv.order_id === o.id);
  const currentStepIndex = o.status === "cancelled" ? -1 : TIMELINE_STEPS.indexOf(o.status);

  return (
    <div className="pb-8">
      <SalesmanTopBar title={o.order_number} subtitle={formatDate(o.created_at)} back hideAlerts />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        {justPlaced && (
          <div className="rounded-lg bg-primary-soft px-3.5 py-3 text-sm font-medium text-ink">
            ✓ Order placed successfully and synced to the server.
          </div>
        )}

        <Card className="flex items-center justify-between p-4">
          <div>
            <p className="text-sm font-semibold text-ink">{customer.data?.business_name ?? "Customer"}</p>
            <p className="text-xs text-ink-muted">{customer.data?.mobile}</p>
          </div>
          <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
        </Card>

        {o.status !== "cancelled" && (
          <Card className="p-4">
            <p className="mb-3 text-sm font-semibold text-ink">Timeline</p>
            <div className="flex items-center">
              {TIMELINE_STEPS.map((step, i) => (
                <div key={step} className="flex flex-1 items-center last:flex-none">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                      i <= currentStepIndex ? "bg-primary text-white" : "bg-border text-ink-muted"
                    }`}
                  >
                    {i + 1}
                  </div>
                  <p className="ml-1.5 shrink-0 text-[11px] capitalize text-ink-muted">{step}</p>
                  {i < TIMELINE_STEPS.length - 1 && (
                    <div className={`mx-2 h-0.5 flex-1 ${i < currentStepIndex ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold text-ink">Products</p>
          <Card className="flex flex-col divide-y divide-border p-0">
            {o.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="text-ink">Qty {item.ordered_qty}</span>
                <span className="font-medium text-ink">{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </Card>
        </div>

        <Card className="flex flex-col gap-2 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">Subtotal</span>
            <span className="font-medium text-ink">{formatCurrency(o.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">CGST</span>
            <span className="font-medium text-ink">{formatCurrency(o.cgst)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-ink-muted">SGST</span>
            <span className="font-medium text-ink">{formatCurrency(o.sgst)}</span>
          </div>
          {o.igst > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-ink-muted">IGST</span>
              <span className="font-medium text-ink">{formatCurrency(o.igst)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <span className="text-ink">Total</span>
            <span className="text-primary">{formatCurrency(o.total)}</span>
          </div>
        </Card>

        {o.remarks && (
          <Card className="p-4">
            <p className="text-xs font-medium text-ink-muted">Notes</p>
            <p className="text-sm text-ink">{o.remarks}</p>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Button variant="secondary" onClick={() => window.print()}>
            Print
          </Button>
          <Button
            variant="secondary"
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: o.order_number, text: `Order ${o.order_number} - ${formatCurrency(o.total)}` });
              }
            }}
          >
            Share
          </Button>
        </div>

        {relatedInvoice && relatedInvoice.balance > 0 && (
          <Button onClick={() => router.push(`/admin/salesman/payments/${relatedInvoice.invoice_id}`)}>
            Collect Payment ({formatCurrency(relatedInvoice.balance)} due)
          </Button>
        )}
      </div>
    </div>
  );
}
