export type OrderStatus = "pending" | "approved" | "loaded" | "delivered" | "cancelled";
export type OrderSource = "staff" | "customer";

export interface SalesOrderItemResponse {
  id: string;
  product_id: string;
  ordered_qty: number;
  price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  line_total: number;
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
