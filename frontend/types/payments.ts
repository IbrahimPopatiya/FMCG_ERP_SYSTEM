export type PaymentRecordStatus = "pending" | "cleared" | "bounced";

export interface PaymentListItem {
  id: string;
  invoice_id: string;
  invoice_number: string;
  order_number: string;
  customer_id: string;
  driver_id: string | null;
  payment_date: string;
  cash_amount: number;
  upi_amount: number;
  cheque_amount: number;
  total_amount: number;
  reference_number: string | null;
  status: PaymentRecordStatus;
}

export interface PaymentCreate {
  invoice_id: string;
  driver_id?: string | null;
  cash_amount?: number;
  upi_amount?: number;
  cheque_amount?: number;
  reference_number?: string | null;
}

// What POST /payments and /verify and /bounce return - bare shapes, unlike
// the joined PaymentListItem used for list/detail views.
export interface PaymentResponse {
  id: string;
  invoice_id: string;
  total_amount: number;
  status: PaymentRecordStatus;
  created_at: string;
}

export interface PaymentStatusResponse {
  id: string;
  status: PaymentRecordStatus;
  updated_at: string;
}
