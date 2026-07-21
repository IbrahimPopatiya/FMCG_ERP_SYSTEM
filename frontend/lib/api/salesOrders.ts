import { api } from "@/lib/api/client";
import type { SalesOrderCreate, SalesOrderResponse } from "@/types/salesOrder";

export function listOrders() {
  return api.get<SalesOrderResponse[]>("/orders").then((res) => res.data);
}

export function getOrder(orderId: string) {
  return api.get<SalesOrderResponse>(`/orders/${orderId}`).then((res) => res.data);
}

export function createOrder(data: SalesOrderCreate) {
  return api.post<SalesOrderResponse>("/orders", data).then((res) => res.data);
}

export function cancelOrder(orderId: string) {
  return api.post<{ id: string; status: string }>(`/orders/${orderId}/cancel`).then((res) => res.data);
}
