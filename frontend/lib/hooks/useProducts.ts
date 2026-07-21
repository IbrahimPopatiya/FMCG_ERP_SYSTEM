import { useQuery } from "@tanstack/react-query";
import { listProducts } from "@/lib/api/products";

// Pattern to follow for every other domain: one hook per query/mutation,
// wrapping the matching lib/api/<domain>.ts function. Pages call this —
// never lib/api or axios directly.
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });
}
