"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useAssignCustomerSalesman, useSetCustomerStatus } from "@/lib/hooks/useCustomerMutations";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useRoutes } from "@/lib/hooks/useRoutes";
import { useOrders } from "@/lib/hooks/useOrders";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function initialsAvatarTone(seed: string) {
  const tones = [
    "bg-blue-100 text-blue-700",
    "bg-green-100 text-green-700",
    "bg-amber-100 text-amber-700",
    "bg-purple-100 text-purple-700",
    "bg-pink-100 text-pink-700",
  ];
  const hash = seed.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return tones[hash % tones.length];
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <span className="text-sm text-ink-muted">{label}</span>
      <span className="text-sm font-medium text-ink">{value}</span>
    </div>
  );
}

export default function CustomerDetailPage() {
  useRoleGuard(["admin", "salesman", "manager", "cashier"]);

  const { customerId } = useParams<{ customerId: string }>();
  const customer = useCustomer(customerId);
  const setStatus = useSetCustomerStatus(customerId);
  const assignSalesman = useAssignCustomerSalesman(customerId);
  const staffDirectory = useStaffDirectory();
  const routes = useRoutes();
  const [isAssignOpen, setAssignOpen] = useState(false);
  const [orderDate, setOrderDate] = useState("");

  const {
    data: ordersData,
    isLoading: ordersLoading,
    isError: ordersError,
    refetch: refetchOrders,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useOrders(customerId, orderDate || undefined);
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);
  const orders = ordersData?.pages.flatMap((page) => page.items) ?? [];

  const salesmen = (staffDirectory.data ?? []).filter((u) => u.role === "salesman");
  const currentRoute = routes.data?.find((r) => r.id === customer.data?.route_id) ?? null;
  const currentSalesman = salesmen.find((s) => s.id === currentRoute?.salesman_id) ?? null;

  return (
    <div>
      <TopBar title="Customer" subtitle={customer.data?.business_name} backHref="/admin/customers" />

      {customer.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {customer.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this customer.
          </div>
        </div>
      )}

      {customer.data && (() => {
        const data = customer.data;
        return (
          <div className="mx-auto flex max-w-2xl flex-col gap-4 p-4 pb-28 sm:p-6">
            <Card className="flex items-center gap-4 rounded-2xl">
              <div
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-semibold ${initialsAvatarTone(
                  data.id
                )}`}
              >
                {data.business_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{data.business_name}</h1>
                <p className="text-sm text-ink-muted">{data.owner_name}</p>
                <p className="mt-1 font-mono text-xs text-ink-muted">{data.customer_code}</p>
              </div>
              <CustomerStatusBadge status={data.status} />
            </Card>

            <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
              <Row label="Mobile" value={data.mobile} />
              {data.alternate_mobile && <Row label="Alternate mobile" value={data.alternate_mobile} />}
              {data.gst_number && <Row label="GST number" value={data.gst_number} />}
            </div>

            <div className="rounded-2xl border border-border bg-white p-4 shadow-sm">
              <p className="text-sm text-ink-muted">Address</p>
              <p className="mt-1 text-sm font-medium text-ink">
                {data.address}, {data.city}, {data.state} {data.pincode}
              </p>
            </div>

            <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
              <Row label="Salesperson" value={currentSalesman?.full_name ?? "Unassigned"} />
            </div>

            {/* <div className="divide-y divide-border rounded-2xl border border-border bg-white shadow-sm">
              <Row label="Credit limit" value={formatCurrency(data.credit_limit)} />
              <Row label="Payment terms" value={`${data.payment_terms} days`} />
            </div> */}

            <div className="flex justify-end gap-3">
              <Button type="button" variant="secondary" onClick={() => setAssignOpen(true)}>
                Assign Salesperson
              </Button>
              <Button
                type="button"
                variant={data.status === "active" ? "danger" : "primary"}
                isLoading={setStatus.isPending}
                onClick={() => setStatus.mutate(data.status === "active" ? "inactive" : "active")}
              >
                {data.status === "active" ? "Deactivate customer" : "Activate customer"}
              </Button>
            </div>

            <div className="rounded-2xl border border-border bg-white shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border p-4">
                <h2 className="text-sm font-semibold text-ink">Orders</h2>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="rounded-lg border border-border px-3 py-1.5 text-sm text-ink outline-none focus:border-primary"
                  />
                  {orderDate && (
                    <button
                      type="button"
                      onClick={() => setOrderDate("")}
                      className="text-xs font-medium text-ink-muted hover:text-ink"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {ordersLoading && (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )}

              {ordersError && (
                <div className="p-4">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
                    Couldn&apos;t load orders.
                    <Button type="button" variant="secondary" onClick={() => refetchOrders()}>
                      Retry
                    </Button>
                  </div>
                </div>
              )}

              {!ordersLoading && !ordersError && orders.length === 0 && (
                <p className="p-6 text-center text-sm text-ink-muted">
                  {orderDate ? "No orders on this date." : "No orders yet."}
                </p>
              )}

              {!ordersLoading && !ordersError && orders.length > 0 && (
                <div className="divide-y divide-border">
                  {orders.map((order) => (
                    <Link
                      key={order.id}
                      href={`/admin/orders/${order.id}`}
                      className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface"
                    >
                      <div className="min-w-0">
                        <p className="font-mono text-xs font-medium text-ink-muted">{order.order_number}</p>
                        <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                        <p className="mt-0.5 text-xs text-ink-muted">{formatDate(order.created_at)}</p>
                      </div>
                      <OrderStatusBadge status={order.status} />
                    </Link>
                  ))}
                  <div ref={sentinelRef} className="flex justify-center py-3">
                    {isFetchingNextPage && <p className="text-xs text-ink-muted">Loading more…</p>}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      <Modal open={isAssignOpen} onClose={() => setAssignOpen(false)} title="Assign salesperson">
        {salesmen.length === 0 ? (
          <p className="py-4 text-center text-sm text-ink-muted">No salesperson accounts exist yet.</p>
        ) : (
          <div className="flex max-h-80 flex-col gap-1 overflow-y-auto">
            {salesmen.map((salesman) => (
              <button
                key={salesman.id}
                type="button"
                disabled={assignSalesman.isPending}
                onClick={() =>
                  assignSalesman.mutate(salesman.id, { onSuccess: () => setAssignOpen(false) })
                }
                className={`flex items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${currentSalesman?.id === salesman.id
                    ? "bg-primary-soft text-primary"
                    : "text-ink hover:bg-surface"
                  }`}
              >
                {salesman.full_name}
                <span className="text-xs font-normal text-ink-muted">{salesman.mobile}</span>
              </button>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}
