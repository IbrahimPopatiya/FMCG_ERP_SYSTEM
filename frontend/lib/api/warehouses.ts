import { api } from "@/lib/api/client";
import type { WarehouseCreate, WarehouseResponse, WarehouseStatus } from "@/types/warehouses";

export function listWarehouses() {
  return api.get<WarehouseResponse[]>("/warehouses").then((res) => res.data);
}

export function createWarehouse(data: WarehouseCreate) {
  return api.post<WarehouseResponse>("/warehouses", data).then((res) => res.data);
}

export function setWarehouseStatus(warehouseId: string, status: WarehouseStatus) {
  return api
    .patch<WarehouseResponse>(`/warehouses/${warehouseId}/status`, { status })
    .then((res) => res.data);
}
