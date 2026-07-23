"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useOrders } from "@/lib/hooks/useOrders";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { OrderStatus, SalesOrderResponse } from "@/types/salesOrder";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const STATUS_FILTERS: { value: OrderStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "loaded", label: "Loaded" },
  { value: "delivered", label: "Delivered" },
  { value: "cancelled", label: "Cancelled" },
];

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

export default function AdminOrdersPage() {
  useRoleGuard(["admin", "salesman", "manager", "dispatcher"]);

  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const orders = useOrders();
  const customers = useCustomerDirectorySample();

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const sorted = useMemo(
    () =>
      [...(orders.data ?? [])]
        .filter((o) => statusFilter === "all" || o.status === statusFilter)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [orders.data, statusFilter]
  );

  const pendingCount = (orders.data ?? []).filter((o) => o.status === "pending").length;

  return (
    <div>
      <TopBar title="Orders" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Orders</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {pendingCount > 0
                ? `${pendingCount} order${pendingCount === 1 ? "" : "s"} waiting on approval`
                : "Every order across the business"}
            </p>
          </div>
        </div>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === filter.value
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-muted hover:bg-surface"
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </header>

      {orders.isLoading && <SkeletonRows />}

      {orders.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load orders.
            <Button type="button" variant="secondary" onClick={() => orders.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!orders.isLoading && !orders.isError && sorted.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No orders here</p>
          <p className="text-sm text-ink-muted">
            {statusFilter === "all" ? "No orders have been placed yet." : "Try a different status filter."}
          </p>
        </div>
      )}

      {!orders.isLoading && !orders.isError && sorted.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<SalesOrderResponse>
                rowKey={(o) => o.id}
                rows={sorted}
                columns={[
                  {
                    header: "Order",
                    render: (o) => (
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="font-mono text-xs font-medium text-ink hover:text-primary"
                      >
                        {o.order_number}
                      </Link>
                    ),
                  },
                  { header: "Customer", render: (o) => customerName(o.customer_id) },
                  { header: "Status", render: (o) => <OrderStatusBadge status={o.status} /> },
                  { header: "Total", render: (o) => formatCurrency(o.total) },
                  { header: "Placed", render: (o) => formatDate(o.created_at) },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {sorted.map((o) => (
              <Link key={o.id} href={`/admin/orders/${o.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{customerName(o.customer_id)}</p>
                    <p className="font-mono text-xs text-ink-muted">{o.order_number}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(o.total)}</p>
                  </div>
                  <OrderStatusBadge status={o.status} />
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
