"use client";

import { OrdersListPage } from "@/components/shared/OrdersListPage";
import type { SalesOrderResponse } from "@/types/salesOrder";

function customerName(order: SalesOrderResponse) {
  return order.customer_name ?? "Unknown customer";
}

export default function SalesmanOrdersPage() {
  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Orders</h1>
      </header>

      <OrdersListPage
        basePath="/salesman/orders"
        customerName={customerName}
        emptyState={{
          title: "No orders yet",
          message: "Orders placed for your route's customers will show up here.",
          cta: { href: "/salesman/products", label: "Start an order" },
        }}
      />
    </div>
  );
}
