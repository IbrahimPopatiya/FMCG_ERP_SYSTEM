import { api } from "@/lib/api/client";
import type { WarehouseResponse } from "@/types/warehouses";

export function listWarehouses() {
  return api.get<WarehouseResponse[]>("/warehouses").then((res) => res.data);
}
