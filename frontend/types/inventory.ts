export interface InventoryResponse {
  warehouse_id: string;
  product_id: string;
  physical_stock: number;
  reserved_stock: number;
  damaged_stock: number;
  expiry_stock: number;
  sellable_stock: number;
}
