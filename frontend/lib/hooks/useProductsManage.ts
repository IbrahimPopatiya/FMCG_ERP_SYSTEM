import { useInfiniteQuery } from "@tanstack/react-query";
import { listProductsForManagement } from "@/lib/api/products";

const PAGE_SIZE = 10;

// Powers the staff product list's scrollable infinite loading — each page
// is fetched as the user nears the bottom of the list (see ProductsPage).
// `search` matches product name, SKU, or brand name (server-side). `brandId`
// narrows the list to one brand (the filter row below the search bar).
export function useProductsManage(search: string, brandId?: string | null) {
  return useInfiniteQuery({
    queryKey: ["products", "manage", search, brandId ?? null],
    queryFn: ({ pageParam }) => listProductsForManagement(pageParam, PAGE_SIZE, search, brandId),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
