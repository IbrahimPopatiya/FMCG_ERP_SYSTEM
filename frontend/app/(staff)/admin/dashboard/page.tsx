"use client";

import Link from "next/link";
import { AdminTopBar } from "@/components/admin/AdminTopBar";
import { BellIcon } from "@/components/admin/icons";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { StatCard } from "@/components/ui/StatCard";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useInventory } from "@/lib/hooks/useInventory";
import { useProductStockList } from "@/lib/hooks/useProductStockList";
import { usePaymentsManage } from "@/lib/hooks/usePayments";
import { useCurrentUser } from "@/lib/hooks/useUsers";
import { formatCurrency } from "@/lib/utils/format";
import type { SalesOrderResponse } from "@/types/salesOrder";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

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
  { href: "/admin/orders", label: "Sales Orders", hint: "Review & approve" },
  { href: "/admin/suppliers", label: "Purchases", hint: "Suppliers & orders" },
  { href: "/admin/payments", label: "Payments", hint: "Cash, UPI, cheque" },
  { href: "/admin/inventory", label: "Inventory", hint: "Stock & low alerts" },
];

export default function DashboardPage() {
  useRoleGuard(["admin", "salesman", "driver", "manager", "dispatcher", "cashier"]);

  const currentUser = useCurrentUser();
  const orders = useOrders();
  const inventory = useInventory();
  const stock = useProductStockList();
  const payments = usePaymentsManage();

  const allOrders = orders.data ?? [];
  const todaysOrders = allOrders.filter((o) => isToday(o.created_at));
  const todaysValue = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const pendingApprovals = allOrders.filter((o) => o.status === "pending");

  const recentOrders = [...allOrders]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 6);

  const allPayments = payments.data?.pages.flatMap((p) => p.items) ?? [];
  const todaysReceipts = allPayments.filter((p) => isToday(p.payment_date));
  const todaysReceiptsValue = todaysReceipts.reduce((sum, p) => sum + p.total_amount, 0);

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

  const firstName = currentUser.data?.full_name?.split(" ")[0];

  return (
    <div>
      <AdminTopBar
        title={firstName ? `Welcome back, ${firstName}` : "Admin Dashboard"}
        subtitle={new Intl.DateTimeFormat("en-IN", { weekday: "long", day: "2-digit", month: "long" }).format(
          TODAY
        )}
        right={
          <span className="flex h-9 w-9 items-center justify-center rounded-full text-white/90">
            <BellIcon className="h-5 w-5" />
          </span>
        }
      />

      <div className="flex flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <StatCard
            label="Today's sales"
            value={String(todaysOrders.length)}
            hint={todaysOrders.length > 0 ? formatCurrency(todaysValue) : "No orders yet"}
            isLoading={summaryLoading}
          />
          <StatCard
            label="Today's receipts"
            value={formatCurrency(todaysReceiptsValue)}
            hint={`${todaysReceipts.length} payment${todaysReceipts.length === 1 ? "" : "s"}`}
            isLoading={payments.isLoading}
          />
          <StatCard
            label="Pending approvals"
            value={String(pendingApprovals.length)}
            hint="Waiting on you"
            isLoading={summaryLoading}
            tone={pendingApprovals.length > 0 ? "warning" : "neutral"}
          />
          <StatCard
            label="Low stock alerts"
            value={String(lowStockProducts.length)}
            hint="At or below minimum"
            isLoading={stock.isLoading || inventory.isLoading}
            tone={lowStockProducts.length > 0 ? "danger" : "neutral"}
          />
        </div>

        {pendingApprovals.length > 0 && (
          <Card className="flex items-center justify-between gap-3 rounded-2xl border-amber-200 bg-amber-50 sm:hidden">
            <div>
              <p className="text-sm font-semibold text-ink">
                {pendingApprovals.length} order{pendingApprovals.length === 1 ? "" : "s"} waiting
              </p>
              <p className="text-xs text-ink-muted">Needs your approval</p>
            </div>
            <Link href="/admin/orders" className="text-sm font-medium text-primary">
              Review
            </Link>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3 sm:hidden">
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="flex flex-col gap-1 rounded-2xl">
                <p className="text-sm font-semibold text-ink">{action.label}</p>
                <p className="text-xs text-ink-muted">{action.hint}</p>
              </Card>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Recent activity</h2>
              <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
                View all
              </Link>
            </div>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-2xl border border-border bg-white shadow-sm sm:block">
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

            {/* Mobile: card list */}
            <div className="flex flex-col gap-2 sm:hidden">
              {orders.isLoading ? (
                Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)
              ) : recentOrders.length === 0 ? (
                <Card className="rounded-2xl text-center text-sm text-ink-muted">No orders placed yet.</Card>
              ) : (
                recentOrders.map((o) => (
                  <Link key={o.id} href={`/admin/orders/${o.id}`}>
                    <Card className="flex items-center justify-between gap-3 rounded-2xl">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-ink-muted">{o.order_number}</p>
                        <p className="mt-0.5 text-sm font-semibold text-ink">{formatCurrency(o.total)}</p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </Card>
                  </Link>
                ))
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
            <Card className="rounded-2xl p-0">
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
                      <Badge tone={p.sellable <= 0 ? "danger" : "warning"}>{p.sellable} left</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
