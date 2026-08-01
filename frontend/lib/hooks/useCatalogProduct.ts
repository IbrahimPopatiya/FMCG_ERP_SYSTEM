import { useQuery } from "@tanstack/react-query";
import { getCatalogProduct } from "@/lib/api/products";

export function useCatalogProduct(productId: string) {
  return useQuery({
    queryKey: ["products", "catalog", productId],
    queryFn: () => getCatalogProduct(productId),
    enabled: !!productId,
  });
}
