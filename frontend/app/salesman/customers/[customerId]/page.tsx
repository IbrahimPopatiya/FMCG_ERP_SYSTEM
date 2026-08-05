"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { StoreIcon } from "@/components/customer/icons";
import { useOrders } from "@/lib/hooks/useOrders";
import { useSalesmanCustomers } from "@/lib/hooks/useSalesmanCustomers";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";

export default function SalesmanCustomerOrdersPage() {
  const { customerId } = useParams<{ customerId: string }>();
  const router = useRouter();
  const { data: customersPage } = useSalesmanCustomers();
  const customer = customersPage?.items.find((c) => c.id === customerId);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useOrders(customerId);
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);
  const orders = data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
          <StoreIcon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-ink">{customer?.business_name ?? "Customer"}</p>
          <p className="text-xs text-ink-muted">Orders</p>
        </div>
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load orders.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && orders.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <h2 className="text-base font-semibold text-ink">No orders yet</h2>
          <p className="max-w-xs text-sm text-ink-muted">
            Orders placed for this customer will show up here.
          </p>
        </div>
      )}

      {!isLoading && !isError && (orders.length > 0 || hasNextPage) && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-3 p-4 pb-6 md:p-8">
          {orders.map((order) => (
            <Link
              key={order.id}
              href={`/salesman/orders/${order.id}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="min-w-0">
                <p className="font-mono text-xs font-medium text-ink-muted">{order.order_number}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                <p className="mt-0.5 text-xs text-ink-muted">{formatDate(order.created_at)}</p>
              </div>
              <OrderStatusBadge status={order.status} />
            </Link>
          ))}
          <div ref={sentinelRef} className="flex justify-center py-4">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
