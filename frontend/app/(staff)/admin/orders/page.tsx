"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { AdminTopBar, AdminIconButton } from "@/components/admin/AdminTopBar";
import { SearchIcon, FilterIcon } from "@/components/admin/icons";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
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
  const [view, setView] = useState<"date" | "salesman">("date");
  const [showSearch, setShowSearch] = useState(false);
  const [search, setSearch] = useState("");

  const orders = useOrders();
  const customers = useCustomerDirectorySample();
  const staff = useStaffDirectory();

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";
  const salesmanName = (salesmanId: string | null) =>
    salesmanId ? staff.data?.find((u) => u.id === salesmanId)?.full_name ?? "Unassigned" : "Unassigned";

  const filtered = useMemo(() => {
    let items = [...(orders.data ?? [])].filter(
      (o) => statusFilter === "all" || o.status === statusFilter
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      items = items.filter(
        (o) => o.order_number.toLowerCase().includes(q) || customerName(o.customer_id).toLowerCase().includes(q)
      );
    }
    return items.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders.data, statusFilter, search, customers.data]);

  const groupedByDate = useMemo(() => {
    const map = new Map<string, SalesOrderResponse[]>();
    for (const o of filtered) {
      const key = formatDate(o.created_at);
      map.set(key, [...(map.get(key) ?? []), o]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const groupedBySalesman = useMemo(() => {
    const map = new Map<string, { name: string; orders: SalesOrderResponse[] }>();
    for (const o of filtered) {
      const key = o.salesman_id ?? "unassigned";
      const entry = map.get(key) ?? { name: salesmanName(o.salesman_id), orders: [] };
      entry.orders.push(o);
      map.set(key, entry);
    }
    return Array.from(map.entries()).sort(
      (a, b) => b[1].orders.reduce((s, o) => s + o.total, 0) - a[1].orders.reduce((s, o) => s + o.total, 0)
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, staff.data]);

  const pendingCount = (orders.data ?? []).filter((o) => o.status === "pending").length;

  return (
    <div>
      <AdminTopBar
        title="Sales Orders"
        subtitle={pendingCount > 0 ? `${pendingCount} waiting on approval` : "Every order across the business"}
        back
        right={
          <>
            <AdminIconButton label="Search" onClick={() => setShowSearch((v) => !v)}>
              <SearchIcon className="h-5 w-5" />
            </AdminIconButton>
            <AdminIconButton label="Filter" onClick={() => setView((v) => (v === "date" ? "salesman" : "date"))}>
              <FilterIcon className="h-5 w-5" />
            </AdminIconButton>
          </>
        }
      />

      <div className="sticky top-[68px] z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-3 sm:px-6">
        {showSearch && (
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or customer…"
            className="h-10 w-full rounded-lg border border-border px-3 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        )}
        <div className="flex items-center justify-between gap-3">
          <div className="flex gap-2 overflow-x-auto">
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
          <Button
            type="button"
            variant="secondary"
            className="h-8 shrink-0 px-3 text-xs"
            onClick={() => setView((v) => (v === "date" ? "salesman" : "date"))}
          >
            {view === "date" ? "Salesman Wise" : "Date Wise"}
          </Button>
        </div>
      </div>

      {orders.isLoading && <SkeletonRows />}

      {orders.isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load orders.
          </div>
        </div>
      )}

      {!orders.isLoading && !orders.isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No orders here</p>
          <p className="text-sm text-ink-muted">Try a different status filter or search term.</p>
        </div>
      )}

      {!orders.isLoading && !orders.isError && filtered.length > 0 && view === "date" && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<SalesOrderResponse>
                rowKey={(o) => o.id}
                rows={filtered}
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

          {/* Mobile: date-grouped card list, matching the design mock */}
          <div className="flex flex-col gap-4 sm:hidden">
            {groupedByDate.map(([date, dayOrders]) => (
              <div key={date}>
                <h2 className="mb-2 text-sm font-semibold text-ink-muted">{date}</h2>
                <div className="flex flex-col gap-2">
                  {dayOrders.map((o) => (
                    <Link key={o.id} href={`/admin/orders/${o.id}`}>
                      <Card className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-ink">{customerName(o.customer_id)}</p>
                          <p className="font-mono text-xs text-ink-muted">{o.order_number}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <p className="text-sm font-semibold text-ink">{formatCurrency(o.total)}</p>
                          <OrderStatusBadge status={o.status} />
                        </div>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!orders.isLoading && !orders.isError && filtered.length > 0 && view === "salesman" && (
        <div className="p-4 sm:p-6">
          <h2 className="mb-3 text-sm font-semibold text-ink">Salesman Wise</h2>
          <div className="flex flex-col gap-2">
            {groupedBySalesman.map(([id, entry]) => (
              <Card key={id} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {entry.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{entry.name}</p>
                    <p className="text-xs text-ink-muted">{entry.orders.length} orders</p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-primary">
                  {formatCurrency(entry.orders.reduce((s, o) => s + o.total, 0))}
                </p>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
