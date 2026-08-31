export type OrderStatus = "pending" | "approved" | "loaded" | "delivered" | "cancelled";
export type OrderSource = "salesman" | "customer";

export interface OrderDateCount {
  order_date: string;
  order_count: number;
}

export interface SalesOrderItemCreate {
  product_id: string;
  ordered_qty: number;
}

export interface SalesOrderCreate {
  customer_id?: string;
  remarks?: string;
  items: SalesOrderItemCreate[];
}

export interface SalesOrderItemResponse {
  id: string;
  product_id: string;
  product_name: string;
  image: string | null;
  unit: string | null;
  loading_capacity: number;
  units_per_box: number;
  ordered_qty: number;
  approved_qty: number;
  loaded_qty: number;
  price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
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
  customer_name: string | null;
  salesman_id: string | null;
  order_source: OrderSource;
  status: OrderStatus;
  remarks: string | null;
  expected_delivery: string | null;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  round_off: number;
  total: number;
  items: SalesOrderItemResponse[];
  created_at: string;
}
