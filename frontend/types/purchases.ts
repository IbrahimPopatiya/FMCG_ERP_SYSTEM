export type PurchaseStatus = "draft" | "received" | "cancelled";

export interface PurchaseItemResponse {
  id: string;
  product_id: string;
  quantity: number;
  purchase_price: number;
  gst_rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface PurchaseResponse {
  id: string;
  supplier_id: string;
  warehouse_id: string;
  purchase_number: string;
  purchase_date: string;
  status: PurchaseStatus;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  round_off: number;
  total: number;
  items: PurchaseItemResponse[];
}

export interface PurchaseItemCreate {
  product_id: string;
  quantity: number;
  purchase_price: number;
}

export interface PurchaseCreate {
  supplier_id: string;
  warehouse_id: string;
  purchase_date?: string;
  items: PurchaseItemCreate[];
}

export interface PurchaseReceiveItem {
  item_id: string;
  received_qty: number;
}

export interface PurchaseReceiveResponse {
  id: string;
  status: PurchaseStatus;
  movements_created: number;
  updated_at: string;
}

export interface PurchaseCancelResponse {
  id: string;
  status: PurchaseStatus;
}
