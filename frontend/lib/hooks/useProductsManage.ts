import { useInfiniteQuery } from "@tanstack/react-query";
import { listProductsForManagement } from "@/lib/api/products";

const PAGE_SIZE = 20;

// Powers the staff product list's scrollable infinite loading — each page
// is fetched as the user nears the bottom of the list (see ProductsPage).
// `search` matches product name, SKU, or brand name (server-side).
export function useProductsManage(search: string) {
  return useInfiniteQuery({
    queryKey: ["products", "manage", search],
    queryFn: ({ pageParam }) => listProductsForManagement(pageParam, PAGE_SIZE, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
