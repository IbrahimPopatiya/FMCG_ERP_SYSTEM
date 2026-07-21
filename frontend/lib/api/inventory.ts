import { api } from "@/lib/api/client";
import type {
  InventoryAdjustmentCreate,
  InventoryAdjustmentResponse,
  InventoryResponse,
  InventoryTransferCreate,
  InventoryTransferResponse,
} from "@/types/inventory";

export function getInventory() {
  return api.get<InventoryResponse[]>("/inventory").then((res) => res.data);
}

export function createInventoryAdjustment(data: InventoryAdjustmentCreate) {
  return api.post<InventoryAdjustmentResponse>("/inventory/adjustments", data).then((res) => res.data);
}

export function createInventoryTransfer(data: InventoryTransferCreate) {
  return api.post<InventoryTransferResponse>("/inventory/transfers", data).then((res) => res.data);
}
