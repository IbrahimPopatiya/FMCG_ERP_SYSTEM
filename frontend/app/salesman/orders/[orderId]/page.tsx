"use client";

import { OrderDetailPage } from "@/components/shared/OrderDetailPage";

// Back goes to Products instead of the browser history's Cart, so after
// placing one customer's order the salesman lands where they can pick the
// next customer, not back in the (now empty) cart.
export default function SalesmanOrderDetailPage() {
  return <OrderDetailPage backHref="/salesman/products" />;
}
