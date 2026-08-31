import { api } from "@/lib/api/client";
import type {
  OrderDateCount,
  SalesOrderApproveItem,
  SalesOrderCreate,
  SalesOrderLoadItem,
  SalesOrderResponse,
} from "@/types/salesOrder";
import type { Page } from "@/types/pagination";

export function listOrders(
  page: number,
  pageSize: number,
  customerId?: string,
  orderDate?: string,
  onlyMine?: boolean
) {
  return api
    .get<Page<SalesOrderResponse>>("/orders", {
      params: {
        page,
        page_size: pageSize,
        customer_id: customerId,
        order_date: orderDate,
        only_mine: onlyMine || undefined,
      },
    })
    .then((res) => res.data);
}

// Distinct days that have orders, newest first, with a count per day —
// powers the admin/salesman Orders screen's day-list landing view.
// `onlyMine` scopes it to orders the current account placed - used when an
// admin is on the salesman ordering screens (see RoleSwitchCards), since
// their real DB role is still "admin" and would otherwise see every order.
export function listOrderDates(onlyMine?: boolean) {
  return api
    .get<OrderDateCount[]>("/orders/dates", { params: { only_mine: onlyMine || undefined } })
    .then((res) => res.data);
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

export function approveOrder(orderId: string, items: SalesOrderApproveItem[]) {
  return api.post(`/orders/${orderId}/approve`, { items }).then((res) => res.data);
}

export function loadOrder(orderId: string, items: SalesOrderLoadItem[]) {
  return api.post(`/orders/${orderId}/load`, { items }).then((res) => res.data);
}
