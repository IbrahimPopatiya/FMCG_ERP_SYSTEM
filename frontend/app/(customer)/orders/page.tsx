"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function OrdersPage() {
  const orders = useOrders();
  const sorted = [...(orders.data ?? [])].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Your Orders</h1>
      </header>

      {orders.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {orders.isError && (
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load your orders.
            <Button type="button" variant="secondary" onClick={() => orders.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!orders.isLoading && !orders.isError && sorted.length === 0 && (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <h2 className="text-base font-semibold text-ink">No orders yet</h2>
          <p className="max-w-xs text-sm text-ink-muted">
            Orders you place will show up here so you can track their status.
          </p>
          <Link href="/products">
            <Button type="button" className="mt-1">
              Start an order
            </Button>
          </Link>
        </div>
      )}

      {!orders.isLoading && !orders.isError && sorted.length > 0 && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 pb-6 md:p-8">
          {sorted.map((order) => (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div>
                <p className="font-mono text-xs font-medium text-ink-muted">{order.order_number}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{formatDate(order.created_at)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
