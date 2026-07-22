export type OrderStatus = "pending" | "approved" | "loaded" | "delivered" | "cancelled";
export type OrderSource = "salesman" | "customer";

export interface SalesOrderItemCreate {
  product_id: string;
  ordered_qty: number;
}

export interface SalesOrderCreate {
  remarks?: string;
  items: SalesOrderItemCreate[];
}

export interface SalesOrderItemResponse {
  id: string;
  product_id: string;
  ordered_qty: number;
  approved_qty: number;
  loaded_qty: number;
  price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  line_total: number;
}

export interface SalesOrderApproveItem {
  item_id: string;
  approved_qty: number;
}

export interface SalesOrderLoadItem {
  item_id: string;
  loaded_qty: number;
}

export interface SalesOrderResponse {
  id: string;
  order_number: string;
  customer_id: string;
  salesman_id: string | null;
  order_source: OrderSource;
  status: OrderStatus;
  remarks: string | null;
  expected_delivery: string | null;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
  items: SalesOrderItemResponse[];
  created_at: string;
}
