import { api } from "@/lib/api/client";
import type {
  SalesOrderApproveItem,
  SalesOrderCreate,
  SalesOrderItemResponse,
  SalesOrderLoadItem,
  SalesOrderResponse,
} from "@/types/salesOrder";

// Decimal fields serialize as JSON strings from the backend (pydantic
// Decimal encoding), not numbers - normalize them here, once, so every
// caller can rely on the `number` type the interfaces declare instead of
// silently doing string concatenation (`sum + item.ordered_qty`) or
// crashing (`.toFixed()` on a string) at the point of use. Same pattern as
// lib/api/trips.ts and lib/api/vehicles.ts.
function normalizeItem(item: SalesOrderItemResponse): SalesOrderItemResponse {
  return {
    ...item,
    ordered_qty: Number(item.ordered_qty),
    approved_qty: Number(item.approved_qty),
    loaded_qty: Number(item.loaded_qty),
    price: Number(item.price),
    gst_rate: Number(item.gst_rate),
    cgst: Number(item.cgst),
    sgst: Number(item.sgst),
    igst: Number(item.igst),
    line_total: Number(item.line_total),
  };
}

function normalizeOrder(order: SalesOrderResponse): SalesOrderResponse {
  return {
    ...order,
    subtotal: Number(order.subtotal),
    discount: Number(order.discount),
    cgst: Number(order.cgst),
    sgst: Number(order.sgst),
    igst: Number(order.igst),
    round_off: Number(order.round_off),
    total: Number(order.total),
    items: order.items.map(normalizeItem),
  };
}

export function listOrders() {
  return api.get<SalesOrderResponse[]>("/orders").then((res) => res.data.map(normalizeOrder));
}

export function getOrder(orderId: string) {
  return api.get<SalesOrderResponse>(`/orders/${orderId}`).then((res) => normalizeOrder(res.data));
}

export function createOrder(data: SalesOrderCreate) {
  return api.post<SalesOrderResponse>("/orders", data).then((res) => normalizeOrder(res.data));
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
