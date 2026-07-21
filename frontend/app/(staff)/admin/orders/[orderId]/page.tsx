"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useOrder } from "@/lib/hooks/useOrders";
import { useApproveOrder, useCancelOrder, useLoadOrder } from "@/lib/hooks/useOrderMutations";
import { useProducts } from "@/lib/hooks/useProducts";
import { formatCurrency, formatDate, toTitleCase } from "@/lib/utils/format";
import type { SalesOrderItemResponse } from "@/types/salesOrder";

function actionErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "This order's status changed since you loaded this page. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function AdminOrderDetailPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const order = useOrder(orderId);
  const customer = useCustomer(order.data?.customer_id ?? "");
  const products = useProducts();
  const approveOrder = useApproveOrder(orderId);
  const loadOrder = useLoadOrder(orderId);
  const cancelOrder = useCancelOrder();

  const [qtyByItem, setQtyByItem] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const productName = (productId: string) =>
    products.data?.find((p) => p.id === productId)?.name ?? "Product";

  // Default each qty input to ordered/approved qty until the staff member
  // overrides it — avoids seeding state from a query result in an effect.
  function defaultQtyFor(item: SalesOrderItemResponse, status: string): string {
    if (qtyByItem[item.id] !== undefined) return qtyByItem[item.id];
    return status === "pending" ? String(item.ordered_qty) : String(item.approved_qty || item.ordered_qty);
  }

  async function handleApprove() {
    const data = order.data;
    if (!data) return;
    setActionError(null);
    try {
      await approveOrder.mutateAsync(
        data.items.map((item) => ({
          item_id: item.id,
          approved_qty: Number(defaultQtyFor(item, data.status)),
        }))
      );
    } catch (err) {
      setActionError(actionErrorMessage(err));
    }
  }

  async function handleLoad() {
    const data = order.data;
    if (!data) return;
    setActionError(null);
    try {
      await loadOrder.mutateAsync(
        data.items.map((item) => ({
          item_id: item.id,
          loaded_qty: Number(defaultQtyFor(item, data.status)),
        }))
      );
    } catch (err) {
      setActionError(actionErrorMessage(err));
    }
  }

  async function handleCancel() {
    setActionError(null);
    try {
      await cancelOrder.mutateAsync(orderId);
      setConfirmCancel(false);
    } catch (err) {
      setActionError(actionErrorMessage(err));
      setConfirmCancel(false);
    }
  }

  const editableStatus = order.data?.status === "pending" || order.data?.status === "approved";

  return (
    <div>
      <TopBar title="Order" />

      {order.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {order.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this order.
          </div>
        </div>
      )}

      {order.data && (() => {
        const data = order.data;
        return (
          <div className="mx-auto flex max-w-3xl flex-col gap-4 p-4 sm:p-6">
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs font-medium text-ink-muted">{data.order_number}</p>
                <h1 className="mt-1 text-lg font-semibold text-ink">
                  {customer.data?.business_name ?? "Loading customer…"}
                </h1>
                <p className="mt-0.5 text-sm text-ink-muted">
                  Placed {formatDate(data.created_at)} · {toTitleCase(data.order_source)}
                </p>
              </div>
              <OrderStatusBadge status={data.status} />
            </Card>

            {data.remarks && (
              <Card>
                <p className="text-xs font-medium text-ink-muted">Remarks</p>
                <p className="mt-1 text-sm text-ink">{data.remarks}</p>
              </Card>
            )}

            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <div className="border-b border-border px-4 py-3">
                <p className="text-sm font-semibold text-ink">Items</p>
              </div>
              <div className="flex flex-col divide-y divide-border">
                {data.items.map((item: SalesOrderItemResponse) => (
                  <div key={item.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{productName(item.product_id)}</p>
                      <p className="text-xs text-ink-muted">
                        Ordered {item.ordered_qty} × {formatCurrency(item.price)}
                        {data.status !== "pending" && ` · Approved ${item.approved_qty}`}
                        {(data.status === "loaded" || data.status === "delivered") &&
                          ` · Loaded ${item.loaded_qty}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      {editableStatus ? (
                        <label className="flex items-center gap-2 text-sm text-ink-muted">
                          {data.status === "pending" ? "Approve" : "Load"}
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={defaultQtyFor(item, data.status)}
                            onChange={(e) =>
                              setQtyByItem((prev) => ({ ...prev, [item.id]: e.target.value }))
                            }
                            className="h-9 w-20 rounded-lg border border-border px-2 text-sm text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary-soft"
                          />
                        </label>
                      ) : (
                        <p className="text-sm font-semibold text-ink">{formatCurrency(item.line_total)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Card className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm text-ink-muted">
                <span>Subtotal</span>
                <span>{formatCurrency(data.subtotal)}</span>
              </div>
              {data.discount > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>Discount</span>
                  <span>−{formatCurrency(data.discount)}</span>
                </div>
              )}
              {data.cgst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>CGST</span>
                  <span>{formatCurrency(data.cgst)}</span>
                </div>
              )}
              {data.sgst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>SGST</span>
                  <span>{formatCurrency(data.sgst)}</span>
                </div>
              )}
              {data.igst > 0 && (
                <div className="flex items-center justify-between text-sm text-ink-muted">
                  <span>IGST</span>
                  <span>{formatCurrency(data.igst)}</span>
                </div>
              )}
              <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
                <span>Total</span>
                <span>{formatCurrency(data.total)}</span>
              </div>
            </Card>

            {actionError && (
              <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
                {actionError}
              </div>
            )}

            {(data.status === "pending" || data.status === "approved") && (
              <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  className="order-2 sm:order-1"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel order
                </Button>
                {data.status === "pending" && (
                  <Button
                    type="button"
                    className="order-1 sm:order-2"
                    isLoading={approveOrder.isPending}
                    onClick={handleApprove}
                  >
                    Approve order
                  </Button>
                )}
                {data.status === "approved" && (
                  <Button
                    type="button"
                    className="order-1 sm:order-2"
                    isLoading={loadOrder.isPending}
                    onClick={handleLoad}
                  >
                    Mark as loaded
                  </Button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      <ConfirmDialog
        open={confirmCancel}
        title="Cancel order"
        message="This cancels the order for the customer. This can't be undone."
        confirmLabel="Cancel order"
        tone="danger"
        isConfirming={cancelOrder.isPending}
        onConfirm={handleCancel}
        onCancel={() => setConfirmCancel(false)}
      />
    </div>
  );
}
