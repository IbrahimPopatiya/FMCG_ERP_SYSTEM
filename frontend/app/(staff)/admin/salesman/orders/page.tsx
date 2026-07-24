"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchIcon, ChevronRightIcon } from "@/components/salesman/icons";
import { useOrders } from "@/lib/hooks/useOrders";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
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

const FILTERS: { id: OrderStatus | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "pending", label: "Pending" },
  { id: "approved", label: "Confirmed" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

export default function SalesmanOrdersPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const orders = useOrders();
  const customers = useCustomers(200);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");

  const customerNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of customers.data?.items ?? []) map.set(c.id, c.business_name);
    return map;
  }, [customers.data]);

  const filtered = useMemo(() => {
    let items = [...(orders.data ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    if (filter !== "all") items = items.filter((o) => o.status === filter);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          (customerNameById.get(o.customer_id) ?? "").toLowerCase().includes(q)
      );
    }
    return items;
  }, [orders.data, filter, debouncedSearch, customerNameById]);

  return (
    <div>
      <SalesmanTopBar title="Orders" subtitle={`${orders.data?.length ?? 0} total`} />

      <div className="flex flex-col gap-4 p-4 sm:p-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order # or customer…"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
                filter === f.id ? "bg-primary text-white" : "border border-border bg-white text-ink-muted"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Card className="flex flex-col divide-y divide-border p-0">
          {orders.isLoading && (
            <div className="p-4">
              <Skeleton className="h-16 w-full" />
            </div>
          )}
          {!orders.isLoading && filtered.length === 0 && (
            <p className="p-4 text-sm text-ink-muted">No orders found.</p>
          )}
          {filtered.map((order) => (
            <Link
              key={order.id}
              href={`/admin/salesman/orders/${order.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-ink">
                  {customerNameById.get(order.customer_id) ?? "Customer"}
                </p>
                <p className="text-xs text-ink-muted">
                  {order.order_number} · {formatDate(order.created_at)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                <Badge tone={STATUS_TONE[order.status]}>{order.status}</Badge>
                <ChevronRightIcon className="h-4 w-4 text-ink-muted" />
              </div>
            </Link>
          ))}
        </Card>
      </div>
    </div>
  );
}
