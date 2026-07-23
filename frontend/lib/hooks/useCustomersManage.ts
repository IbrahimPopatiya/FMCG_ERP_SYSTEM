import { useInfiniteQuery } from "@tanstack/react-query";
import { listCustomers } from "@/lib/api/customers";

const PAGE_SIZE = 20;

export function useCustomersManage(search: string) {
  return useInfiniteQuery({
    queryKey: ["customers", "manage", search],
    queryFn: ({ pageParam }) => listCustomers(pageParam, PAGE_SIZE, search || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
