import { useInfiniteQuery } from "@tanstack/react-query";
import { getInventory } from "@/lib/api/inventory";

const PAGE_SIZE = 50;

export function useInventory() {
  return useInfiniteQuery({
    queryKey: ["inventory"],
    queryFn: ({ pageParam }) => getInventory(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
