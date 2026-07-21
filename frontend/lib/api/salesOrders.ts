import { api } from "@/lib/api/client";
import type { SalesOrderResponse } from "@/types/salesOrder";

export function listOrders() {
  return api.get<SalesOrderResponse[]>("/orders").then((res) => res.data);
}

export function getOrder(orderId: string) {
  return api.get<SalesOrderResponse>(`/orders/${orderId}`).then((res) => res.data);
}
