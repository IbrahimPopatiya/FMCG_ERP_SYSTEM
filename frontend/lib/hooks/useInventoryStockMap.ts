import { useQuery } from "@tanstack/react-query";
import { getInventory } from "@/lib/api/inventory";

// Product-level sellable stock, summed across warehouses — the Take Order
// grid only needs "is this in stock", not a per-warehouse breakdown.
export function useInventoryStockMap() {
  return useQuery({
    queryKey: ["inventory", "stock-map"],
    queryFn: getInventory,
    select: (rows) => {
      const map = new Map<string, number>();
      for (const row of rows) {
        map.set(row.product_id, (map.get(row.product_id) ?? 0) + row.sellable_stock);
      }
      return map;
    },
  });
}
