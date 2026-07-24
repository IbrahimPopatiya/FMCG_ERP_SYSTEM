"use client";

import Link from "next/link";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  UsersIcon,
  OrdersIcon,
  CartIcon,
  ChartIcon,
  ChevronRightIcon,
  PlusIcon,
} from "@/components/salesman/icons";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useOrders } from "@/lib/hooks/useOrders";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { formatCurrency, formatDate, isSameDate, toDateInputValue } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { OrderStatus } from "@/types/salesOrder";

const STATUS_TONE: Record<OrderStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  approved: "neutral",
  loaded: "neutral",
  delivered: "success",
  cancelled: "danger",
};

const QUICK_ACTIONS = [
  { href: "/admin/salesman/customers?intent=take-order", label: "Take Order", icon: CartIcon },
  { href: "/admin/salesman/customers", label: "Customers", icon: UsersIcon },
  { href: "/admin/salesman/orders", label: "Orders", icon: OrdersIcon },
  { href: "/admin/salesman/reports", label: "Reports", icon: ChartIcon },
];

function SummaryTile({
  label,
  value,
  isLoading,
  tone = "neutral",
}: {
  label: string;
  value: string;
  isLoading: boolean;
  tone?: "neutral" | "warning" | "danger" | "success";
}) {
  const valueClass =
    tone === "warning"
      ? "text-amber-600"
      : tone === "danger"
        ? "text-red-600"
        : tone === "success"
          ? "text-primary"
          : "text-ink";

  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs font-medium text-ink-muted">{label}</p>
      {isLoading ? <Skeleton className="h-6 w-16" /> : <p className={`text-lg font-semibold ${valueClass}`}>{value}</p>}
    </div>
  );
}

export default function SalesmanDashboardPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const currentUser = useCurrentUser();
  const orders = useOrders();
  const customers = useCustomers(100);

  const today = toDateInputValue();
  const todaysOrders = (orders.data ?? []).filter((o) => isSameDate(o.created_at, today));
  const todaysSales = todaysOrders.reduce((sum, o) => sum + o.total, 0);
  const newCustomers = (customers.data?.items ?? []).filter((c) => isSameDate(c.created_at, today));
  const visitedToday = new Set(todaysOrders.map((o) => o.customer_id)).size;
  const recentOrders = [...(orders.data ?? [])]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const summaryLoading = orders.isLoading || customers.isLoading;
  const firstName = currentUser.data?.full_name?.split(" ")[0];
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";

  return (
    <div>
      <SalesmanTopBar title={firstName ? `${greeting}, ${firstName}` : greeting} />

      <div className="flex flex-col gap-5 p-4 sm:p-6">
        <Card className="p-4">
          <h2 className="mb-4 text-sm font-semibold text-ink">Today&apos;s Summary</h2>
          <div className="grid grid-cols-2 gap-y-4 sm:grid-cols-4">
            <SummaryTile label="Today's Orders" value={String(todaysOrders.length)} isLoading={summaryLoading} />
            <SummaryTile label="Today's Sales" value={formatCurrency(todaysSales)} isLoading={summaryLoading} />
            <SummaryTile label="New Customers" value={String(newCustomers.length)} isLoading={summaryLoading} />
            <SummaryTile label="Today's Visits" value={String(visitedToday)} isLoading={summaryLoading} />
          </div>
        </Card>

        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white px-3 py-4 text-center shadow-sm transition-colors hover:bg-surface"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-xs font-medium text-ink">{action.label}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Recent Orders</h2>
            <Link href="/admin/salesman/orders" className="text-xs font-medium text-primary">
              View all
            </Link>
          </div>
          <Card className="flex flex-col divide-y divide-border p-0">
            {orders.isLoading && (
              <div className="p-4">
                <Skeleton className="h-16 w-full" />
              </div>
            )}
            {!orders.isLoading && recentOrders.length === 0 && (
              <p className="p-4 text-sm text-ink-muted">No orders yet. Tap Take Order to create one.</p>
            )}
            {recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/salesman/orders/${order.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-surface"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">{order.order_number}</p>
                  <p className="text-xs text-ink-muted">{formatDate(order.created_at)}</p>
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

      <Link
        href="/admin/salesman/customers?intent=take-order"
        className="fixed bottom-20 right-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg sm:bottom-6"
        aria-label="Take order"
      >
        <PlusIcon className="h-6 w-6" />
      </Link>
    </div>
  );
}
