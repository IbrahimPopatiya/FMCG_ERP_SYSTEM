export type PaymentStatus = "unpaid" | "partial" | "paid";
export type TallySyncStatus = "pending" | "synced" | "failed";

export interface InvoiceListItem {
  id: string;
  sales_order_id: string;
  order_number: string;
  customer_id: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
  payment_status: PaymentStatus;
  tally_sync_status: TallySyncStatus;
}

export interface InvoiceCancelResponse {
  id: string;
  status: "cancelled";
  updated_at: string;
}

// What POST /orders/{id}/invoice returns - a bare Invoice row, unlike the
// joined InvoiceListItem used for list/detail views.
export interface InvoiceResponse {
  id: string;
  sales_order_id: string;
  invoice_number: string;
  invoice_date: string;
  place_of_supply: string;
  subtotal: number;
  discount: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
  payment_status: PaymentStatus;
  tally_sync_status: TallySyncStatus;
}
