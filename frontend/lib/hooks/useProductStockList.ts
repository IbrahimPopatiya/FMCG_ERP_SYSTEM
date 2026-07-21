import { useQuery } from "@tanstack/react-query";
import { listProductsForManagement } from "@/lib/api/products";

const DASHBOARD_PRODUCT_SAMPLE_SIZE = 100;

// Feeds the dashboard's low-stock widget. Caps at a fixed page size rather
// than paging through the whole catalog — good enough for a summary card,
// not a source of truth (the Products/Inventory screens are).
export function useProductStockList() {
  return useQuery({
    queryKey: ["products", "manage", "dashboard-sample"],
    queryFn: () => listProductsForManagement(1, DASHBOARD_PRODUCT_SAMPLE_SIZE),
  });
}
