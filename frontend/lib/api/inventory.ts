import { api } from "@/lib/api/client";
import type { InventoryResponse } from "@/types/inventory";

export function getInventory() {
  return api.get<InventoryResponse[]>("/inventory").then((res) => res.data);
}
