import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listProducts, listProductsFeed } from "@/lib/api/products";
import type { ProductsFeedParams } from "@/lib/api/products";

// Pattern to follow for every other domain: one hook per query/mutation,
// wrapping the matching lib/api/<domain>.ts function. Pages call this —
// never lib/api or axios directly.
export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: listProducts,
  });
}

const FEED_PAGE_SIZE = 12;

// Paginated, search/category/sort-aware version for the customer Products
// browsing screen - unlike useProducts(), doesn't fetch the whole catalog.
export function useProductsFeed(params: Omit<ProductsFeedParams, "page" | "pageSize">) {
  return useInfiniteQuery({
    queryKey: ["products", "feed", params],
    queryFn: ({ pageParam }) =>
      listProductsFeed({ ...params, page: pageParam, pageSize: FEED_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
