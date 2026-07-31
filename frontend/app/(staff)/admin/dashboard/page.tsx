"use client";

import { useEffect } from "react";
import Link from "next/link";
import { TopBar } from "@/components/layout/TopBar";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { CartIcon, BoxIcon, BellIcon, TruckIcon, PeopleIcon, WalletIcon } from "@/components/admin/icons";
import { useOrders } from "@/lib/hooks/useOrders";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { formatCurrency, formatDateTime } from "@/lib/utils/format";
import type { OrderStatus, SalesOrderResponse } from "@/types/salesOrder";
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

function isThisWeek(iso: string) {
  const d = new Date(iso);
  const diffDays = (TODAY.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 7;
}

// Per-status icon chip on the "Latest Orders" list — colors follow the same
// tones as OrderStatusBadge so the icon and the pill always agree.
const STATUS_ICON: Record<OrderStatus, { Icon: typeof CartIcon; chip: string }> = {
  pending: { Icon: CartIcon, chip: "bg-amber-50 text-amber-600" },
  approved: { Icon: BoxIcon, chip: "bg-blue-50 text-blue-600" },
  loaded: { Icon: BellIcon, chip: "bg-purple-50 text-purple-600" },
  delivered: { Icon: TruckIcon, chip: "bg-green-50 text-green-600" },
  cancelled: { Icon: CartIcon, chip: "bg-red-50 text-red-600" },
};

function StatCard({
  label,
  value,
  hint,
  tone,
  Icon,
  isLoading,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "blue" | "green" | "purple";
  Icon: typeof CartIcon;
  isLoading: boolean;
}) {
  const CHIP: Record<typeof tone, string> = {
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <Card className="flex flex-col gap-3 rounded-2xl">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${CHIP[tone]}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs font-medium text-ink-muted">{label}</p>
        {isLoading ? (
          <Skeleton className="mt-1 h-7 w-16" />
        ) : (
          <p className="mt-0.5 text-2xl font-bold tracking-tight text-ink">{value}</p>
        )}
        {hint && <p className="mt-0.5 text-xs font-medium text-green-600">{hint}</p>}
      </div>
    </Card>
  );
}

function OrderRow({ order, customerName }: { order: SalesOrderResponse; customerName: string }) {
  const { Icon, chip } = STATUS_ICON[order.status];
  return (
    <Link
      href={`/admin/orders/${order.id}`}
      className="flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-surface/60"
    >
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${chip}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink">
          #{order.order_number} <span className="font-normal text-ink-muted">{customerName}</span>
        </p>
        <p className="mt-0.5 text-xs text-ink-muted">
          {formatDateTime(order.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 flex-col items-end gap-1.5">
        <p className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
        <OrderStatusBadge status={order.status} />
      </div>
    </Link>
  );
}

export default function DashboardPage() {
  useRoleGuard(["admin", "salesman", "driver", "manager", "dispatcher", "cashier"]);

  const orders = useOrders();
  const customers = useCustomerDirectorySample();

  const allOrders = orders.data?.pages.flatMap((page) => page.items) ?? [];
  const totalOrders = orders.data?.pages[0]?.total ?? 0;

  // Orders are sorted newest-first, so this week's stats only need pages up
  // to the first order older than 7 days - keep loading until we hit that,
  // instead of pulling the entire order history just to add up a week's worth.
  const oldestLoaded = allOrders[allOrders.length - 1];
  const shouldLoadMoreForWeeklyStats =
    !!orders.hasNextPage && (!oldestLoaded || isThisWeek(oldestLoaded.created_at));

  useEffect(() => {
    if (shouldLoadMoreForWeeklyStats) {
      orders.fetchNextPage();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldLoadMoreForWeeklyStats]);

  const todaysOrders = allOrders.filter((o) => isToday(o.created_at));
  const thisWeekOrders = allOrders.filter((o) => isThisWeek(o.created_at));
  const weeklyValue = thisWeekOrders.reduce((sum, o) => sum + o.total, 0);
  const allCustomers = customers.data?.items ?? [];
  const activeCustomers = allCustomers.filter((c) => c.status === "active").length;

  const customerName = (customerId: string) =>
    allCustomers.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const recentOrders = [...allOrders]
    .filter((o) => o.status === "pending")
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const isLoading = orders.isLoading;

  return (
    <div>
      <TopBar title="Home" subtitle="Dashboard Overview" />

      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-">
          <StatCard
            label="Total Orders"
            value={String(totalOrders)}
            hint={todaysOrders.length > 0 ? `+${todaysOrders.length} today` : undefined}
            tone="blue"
            Icon={CartIcon}
            isLoading={isLoading}
          />
          <StatCard
            label="Total Customers"
            value={String(allCustomers.length)}
            hint={activeCustomers > 0 ? `${activeCustomers} active` : undefined}
            tone="green"
            Icon={PeopleIcon}
            isLoading={customers.isLoading}
          />
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Latest Orders</h2>
            <Link href="/admin/orders" className="text-sm font-medium text-primary hover:text-primary-hover">
              View All
            </Link>
          </div>

          <Card className="overflow-hidden rounded-2xl p-0">
            {isLoading ? (
              <div className="flex flex-col gap-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : orders.isError ? (
              <p className="p-6 text-center text-sm text-red-600">Couldn&apos;t load orders.</p>
            ) : recentOrders.length === 0 ? (
              <p className="p-6 text-center text-sm text-ink-muted">No orders placed yet.</p>
            ) : (
              <div className="divide-y divide-border/70">
                {recentOrders.map((o) => (
                  <OrderRow key={o.id} order={o} customerName={customerName(o.customer_id)} />
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
