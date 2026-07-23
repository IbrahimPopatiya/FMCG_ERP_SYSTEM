"use client";

import { useState } from "react";
import Link from "next/link";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { CashierDatePicker, CASHIER_TODAY } from "@/components/cashier/CashierDatePicker";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/orders/OrderStatusBadge";
import { useOrders } from "@/lib/hooks/useOrders";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { formatCurrency, isSameDate } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function CashierOrdersPage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const [date, setDate] = useState(CASHIER_TODAY);

  const orders = useOrders();
  const customers = useCustomerDirectorySample();

  const daysOrders = (orders.data ?? [])
    .filter((o) => isSameDate(o.created_at, date))
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  const totalAmount = daysOrders.reduce((sum, o) => sum + o.total, 0);

  const customerName = (customerId: string) =>
    customers.data?.items.find((c) => c.id === customerId)?.business_name ?? "Customer";

  const isLoading = orders.isLoading;

  return (
    <div>
      <CashierTopBar title="Orders" subtitle={date} />

      <div className="border-b border-border bg-white px-4 pt-3 pb-4 sm:px-6">
        <CashierDatePicker value={date} onChange={setDate} />
        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm text-ink-muted">
            {isLoading ? "Loading…" : `${daysOrders.length} order${daysOrders.length === 1 ? "" : "s"}`}
          </p>
          {!isLoading && <p className="text-base font-semibold text-ink">{formatCurrency(totalAmount)}</p>}
        </div>
      </div>

      <div className="flex flex-col gap-3 p-4 sm:p-6">
        {isLoading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}

        {!isLoading && daysOrders.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
            <p className="text-sm font-medium text-ink">No orders on this date</p>
            <p className="text-sm text-ink-muted">Try a different date.</p>
          </div>
        )}

        {!isLoading &&
          daysOrders.map((order) => (
            <Link key={order.id} href={`/admin/cashier/orders/${order.id}`}>
              <Card className="flex items-center justify-between gap-3 transition-colors hover:border-primary/50">
                <div className="min-w-0">
                  <p className="font-mono text-xs font-medium text-ink-muted">{order.order_number}</p>
                  <p className="truncate text-sm font-semibold text-ink">{customerName(order.customer_id)}</p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold text-ink">{formatCurrency(order.total)}</p>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Card>
            </Link>
          ))}
      </div>
    </div>
  );
}
