export interface InventoryResponse {
  warehouse_id: string;
  product_id: string;
  physical_stock: number;
  reserved_stock: number;
  damaged_stock: number;
  expiry_stock: number;
  sellable_stock: number;
}

export interface InventoryAdjustmentCreate {
  warehouse_id: string;
  product_id: string;
  quantity: number;
  reason: string;
}

export interface InventoryAdjustmentResponse {
  movement_id: string;
  warehouse_id: string;
  product_id: string;
  movement_type: string;
  quantity: number;
  balance_after: number;
  created_at: string;
}

export interface InventoryTransferCreate {
  from_warehouse_id: string;
  to_warehouse_id: string;
  product_id: string;
  quantity: number;
}

export interface InventoryTransferResponse {
  transfer_out_movement_id: string;
  transfer_in_movement_id: string;
  product_id: string;
  quantity: number;
  created_at: string;
}
