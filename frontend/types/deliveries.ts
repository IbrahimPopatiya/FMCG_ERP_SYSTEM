export type DeliveryStatus = "pending" | "out_for_delivery" | "delivered" | "failed";

export interface DeliveryListItem {
  id: string;
  invoice_id: string;
  invoice_number: string;
  order_number: string;
  customer_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  status: DeliveryStatus;
  departure_time: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  latitude: number | null;
  longitude: number | null;
  customer_signature: string | null;
  remarks: string | null;
}

// What POST /deliveries, /start, and /fail return - a bare Delivery row,
// unlike the joined DeliveryListItem used for list/detail views.
export interface DeliveryResponse {
  id: string;
  invoice_id: string;
  vehicle_id: string | null;
  driver_id: string | null;
  status: DeliveryStatus;
  departure_time: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  latitude: number | null;
  longitude: number | null;
  customer_signature: string | null;
  remarks: string | null;
}

export interface DeliveryCompleteResponse {
  id: string;
  status: "delivered";
  completion_time: string;
  payment_id: string;
  invoice_payment_status: "unpaid" | "partial" | "paid";
}

export interface DeliveryCreate {
  invoice_id: string;
  vehicle_id?: string | null;
  driver_id?: string | null;
}

export interface DeliveryCompleteRequest {
  status: "delivered";
  latitude: number;
  longitude: number;
  remarks?: string;
  cash_received?: number;
  upi_received?: number;
}
