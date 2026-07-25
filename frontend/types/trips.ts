export type TripStatus = "pending" | "loading" | "out_for_delivery" | "delivered" | "cancelled";

export interface LoadableOrderResponse {
  id: string;
  order_number: string;
  customer_id: string;
  lc_value: number;
  created_at: string;
}

export interface TripOrderResponse {
  sales_order_id: string;
  order_number: string;
  customer_id: string;
  order_status: string;
  lc_value: number;
}

export interface TripResponse {
  id: string;
  trip_number: string;
  vehicle_id: string;
  driver_id: string;
  trip_date: string;
  status: TripStatus;
  remark: string | null;
  total_lc: number;
  orders: TripOrderResponse[];
  created_at: string;
}

export interface TripCreate {
  vehicle_id: string;
  driver_id: string;
  trip_date?: string;
  order_ids: string[];
  remark?: string;
}

export interface TripStatusResponse {
  id: string;
  status: TripStatus;
  updated_at: string;
}
