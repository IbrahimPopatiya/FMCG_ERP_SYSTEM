export type ReturnStatus = "requested" | "approved" | "rejected" | "completed";
export type ReturnReason = "damaged" | "expired" | "wrong_item" | "not_needed";

export interface ReturnItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  reason: string;
}

export interface ReturnListItem {
  id: string;
  invoice_id: string;
  invoice_number: string;
  order_number: string;
  customer_id: string;
  warehouse_id: string;
  reason: ReturnReason;
  remarks: string | null;
  status: ReturnStatus;
  items: ReturnItemResponse[];
  created_at: string;
}

export interface ReturnItemCreate {
  product_id: string;
  quantity: number;
  reason: ReturnReason;
}

export interface ReturnCreate {
  invoice_id: string;
  warehouse_id: string;
  reason: ReturnReason;
  remarks?: string | null;
  items: ReturnItemCreate[];
}

// What POST /returns returns - a bare Return row, unlike the joined
// ReturnListItem used for list/detail views.
export interface ReturnResponse {
  id: string;
  invoice_id: string;
  status: ReturnStatus;
  items: ReturnItemResponse[];
  created_at: string;
}

export interface ReturnStatusResponse {
  id: string;
  status: ReturnStatus;
  updated_at: string;
}

export interface ReturnCompleteResponse {
  id: string;
  status: ReturnStatus;
  movements_created: number;
  credit_note_id: string;
  updated_at: string;
}
