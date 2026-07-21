"use client";

import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useInventory } from "@/lib/hooks/useInventory";
import { useProductStockList } from "@/lib/hooks/useProductStockList";
import { formatCurrency } from "@/lib/utils/format";
import type { SalesOrderResponse } from "@/types/salesOrder";

const TODAY = new Date();

function isToday(iso: string) {
  const d = new Date(iso);
  return (
    d.getFullYear() === TODAY.getFullYear() &&
    d.getMonth() === TODAY.getMonth() &&
    d.getDate() === TODAY.getDate()
  );
}

const QUICK_ACTIONS = [
  { href: "/admin/orders", label: "Orders", hint: "Review & approve" },
  { href: "/admin/deliveries", label: "Deliveries", hint: "Track dispatch" },
  { href: "/admin/products", label: "Products", hint: "Manage catalog" },
  { href: "/admin/customers", label: "Customers", hint: "Accounts & credit" },
];

function StatCard({
  label,
  value,
  hint,
  isLoading,
  tone = "neutral",
}: {
  label: string;
  value: string;
  hint?: string;
  isLoading: boolean;
  tone?: "neutral" | "warning" | "danger";
}) {
  const valueClass =
    tone === "warning" ? "text-amber-600" : tone === "danger" ? "text-red-600" : "text-ink";

  return (
    <Card className="flex flex-col gap-1.5">
      <p className="text-sm font-medium text-ink-muted">{label}</p>
      {isLoading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className={`text-2xl font-semibold tracking-tight ${valueClass}`}>{value}</p>
      )}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </Card>
  );
}

export default function DashboardPage() {
  const orders = useOrders();
  const inventory = useInventory();
  const stock = useProductStockList();

  const allOrders = orders.data ?? [];
  const todaysOrders = allOrders.filter((o) => isToday(o.created_at));
  const todaysValue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingApprovals = allOrders.filter((o) => o.status === "pending");
  const awaitingDelivery = allOrders.filter((o) => o.status === "loaded");

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const sellableByProduct = new Map<string, number>();
  for (const row of inventory.data ?? []) {
    sellableByProduct.set(
      row.product_id,
      (sellableByProduct.get(row.product_id) ?? 0) + row.sellable_stock
    );
  }
  const lowStockProducts = (stock.data?.items ?? [])
    .filter((p) => p.status === "active")
    .map((p) => ({ ...p, sellable: sellableByProduct.get(p.id) ?? 0 }))
    .filter((p) => p.sellable <= p.minimum_stock)
    .sort((a, b) => a.sellable - b.sellable);

  const summaryLoading = orders.isLoading;

  return (
    <div>
      <TopBar title="Dashboard" />

      {/* Desktop: full summary. Mobile: quick actions only (per UI/UX brief). */}
      <div className="hidden flex-col gap-6 p-6 sm:flex">
        <div>
          <p className="text-sm text-ink-muted">
            {new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long" }).format(
              TODAY
            )}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Today's orders"
            value={String(todaysOrders.length)}
            hint={todaysOrders.length > 0 ? formatCurrency(todaysValue) : undefined}
            isLoading={summaryLoading}
          />
          <StatCard
            label="Pending approvals"
            value={String(pendingApprovals.length)}
            hint="Waiting on you"
            isLoading={summaryLoading}
            tone={pendingApprovals.length > 0 ? "warning" : "neutral"}
          />
          <StatCard
            label="Awaiting delivery"
            value={String(awaitingDelivery.length)}
            hint="Loaded, not dispatched"
            isLoading={summaryLoading}
          />
          <StatCard
            label="Low stock alerts"
            value={String(lowStockProducts.length)}
            hint="At or below minimum"
            isLoading={stock.isLoading || inventory.isLoading}
            tone={lowStockProducts.length > 0 ? "danger" : "neutral"}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Recent orders</h2>
              <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
                View all
              </Link>
            </div>
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              {orders.isLoading ? (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : orders.isError ? (
                <p className="p-6 text-center text-sm text-red-600">Couldn&apos;t load orders.</p>
              ) : (
                <Table<SalesOrderResponse>
                  rowKey={(o) => o.id}
                  rows={recentOrders}
                  emptyMessage="No orders placed yet."
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
                    { header: "Status", render: (o) => <OrderStatusBadge status={o.status} /> },
                    { header: "Total", render: (o) => formatCurrency(o.total) },
                    {
                      header: "Placed",
                      render: (o) =>
                        new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit" }).format(
                          new Date(o.created_at)
                        ),
                    },
                  ]}
                />
              )}
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Low stock</h2>
              <Link href="/admin/inventory" className="text-sm font-medium text-primary hover:text-primary-hover">
                View all
              </Link>
            </div>
            <Card className="p-0">
              {stock.isLoading || inventory.isLoading ? (
                <div className="flex flex-col gap-3 p-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : lowStockProducts.length === 0 ? (
                <p className="p-6 text-center text-sm text-ink-muted">
                  All active products are above their minimum stock.
                </p>
              ) : (
                <ul className="divide-y divide-border/70">
                  {lowStockProducts.slice(0, 6).map((p) => (
                    <li key={p.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-ink">{p.name}</p>
                        <p className="font-mono text-xs text-ink-muted">{p.sku}</p>
                      </div>
                      <Badge tone={p.sellable <= 0 ? "danger" : "warning"}>
                        {p.sellable} left
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile: quick actions replace the dashboard, per UI/UX brief. */}
      <div className="flex flex-col gap-4 p-4 sm:hidden">
        {pendingApprovals.length > 0 && (
          <Card className="flex items-center justify-between gap-3 border-amber-200 bg-amber-50">
            <div>
              <p className="text-sm font-semibold text-ink">{pendingApprovals.length} order{pendingApprovals.length === 1 ? "" : "s"} waiting</p>
              <p className="text-xs text-ink-muted">Needs your approval</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-primary">
              Review
            </Link>
          </Card>
        )}
        <div className="grid grid-cols-2 gap-3">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="flex flex-col gap-1">
                <p className="text-sm font-semibold text-ink">{action.label}</p>
                <p className="text-xs text-ink-muted">{action.hint}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
