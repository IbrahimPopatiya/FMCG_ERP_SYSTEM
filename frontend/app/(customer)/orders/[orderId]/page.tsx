"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { OrderTrackingStepper } from "@/components/orders/OrderTrackingStepper";
import { useOrder } from "@/lib/hooks/useOrders";
import { useCancelOrder } from "@/lib/hooks/useOrderMutations";
import { useProducts } from "@/lib/hooks/useProducts";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function OrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const router = useRouter();
  const order = useOrder(orderId);
  const products = useProducts();
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const productName = (productId: string) =>
    products.data?.find((p) => p.id === productId)?.name ?? "Product";

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-ink">Order details</h1>
      </header>

      {order.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {order.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this order.
          </div>
        </div>
      )}

      {order.data && (
        <div className="flex flex-col gap-4 p-4 pb-6">
          <div className="flex items-center justify-between rounded-xl border border-border bg-white p-4">
            <div>
              <p className="font-mono text-xs font-medium text-ink-muted">{order.data.order_number}</p>
              <p className="mt-1 text-sm text-ink-muted">Placed {formatDate(order.data.created_at)}</p>
            </div>
            <OrderStatusBadge status={order.data.status} />
          </div>

          <OrderTrackingStepper status={order.data.status} />

          {order.data.remarks && (
            <div className="rounded-xl border border-border bg-white p-4">
              <p className="text-xs font-medium text-ink-muted">Remarks</p>
              <p className="mt-1 text-sm text-ink">{order.data.remarks}</p>
            </div>
          )}

          <div className="overflow-hidden rounded-xl border border-border bg-white">
            <div className="border-b border-border px-4 py-3">
              <p className="text-sm font-semibold text-ink">Items</p>
            </div>
            <div className="flex flex-col divide-y divide-border">
              {order.data.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-ink">{productName(item.product_id)}</p>
                    <p className="text-xs text-ink-muted">
                      {item.ordered_qty} × {formatCurrency(item.price)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(item.line_total)}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(order.data.subtotal)}</span>
            </div>
            {order.data.discount > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Discount</span>
                <span>−{formatCurrency(order.data.discount)}</span>
              </div>
            )}
            {order.data.cgst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>CGST</span>
                <span>{formatCurrency(order.data.cgst)}</span>
              </div>
            )}
            {order.data.sgst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>SGST</span>
                <span>{formatCurrency(order.data.sgst)}</span>
              </div>
            )}
            {order.data.igst > 0 && (
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>IGST</span>
                <span>{formatCurrency(order.data.igst)}</span>
              </div>
            )}
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(order.data.total)}</span>
            </div>
          </div>

          {order.data.status === "pending" && (
            <Button type="button" variant="danger" className="w-full" onClick={() => setConfirmCancel(true)}>
              Cancel order
            </Button>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel order"
        message="This order hasn't been approved yet, so it can be cancelled. This can't be undone."
        confirmLabel="Cancel order"
        tone="danger"
        isConfirming={cancelOrder.isPending}
        onConfirm={() => cancelOrder.mutate(orderId, { onSuccess: () => setConfirmCancel(false) })}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
