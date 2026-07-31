import { api } from "@/lib/api/client";
import type {
  InventoryAdjustmentCreate,
  InventoryAdjustmentResponse,
  InventoryResponse,
  InventoryTransferCreate,
  InventoryTransferResponse,
} from "@/types/inventory";
import type { Page } from "@/types/pagination";

export function getInventory(page: number, pageSize: number) {
  return api
    .get<Page<InventoryResponse>>("/inventory", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function createInventoryAdjustment(data: InventoryAdjustmentCreate) {
  return api.post<InventoryAdjustmentResponse>("/inventory/adjustments", data).then((res) => res.data);
}

export function createInventoryTransfer(data: InventoryTransferCreate) {
  return api.post<InventoryTransferResponse>("/inventory/transfers", data).then((res) => res.data);
}
