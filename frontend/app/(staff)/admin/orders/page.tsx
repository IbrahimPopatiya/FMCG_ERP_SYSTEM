"use client";

import { useMemo } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { OrdersListPage } from "@/components/shared/OrdersListPage";
import { useCustomerDirectorySample } from "@/lib/hooks/useCustomerDirectorySample";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { SalesOrderResponse } from "@/types/salesOrder";

export default function AdminOrdersPage() {
  useRoleGuard(["admin", "salesman", "manager", "dispatcher"]);

  const customers = useCustomerDirectorySample();

  const customerNameById = useMemo(
    () => new Map((customers.data?.items ?? []).map((c) => [c.id, c.business_name])),
    [customers.data]
  );

  function customerName(order: SalesOrderResponse) {
    return customerNameById.get(order.customer_id) ?? "Customer";
  }

  return (
    <div>
      <TopBar title="Orders" subtitle="All Customer Orders" />
      <OrdersListPage basePath="/admin/orders" customerName={customerName} groupByDate />
    </div>
  );
}
