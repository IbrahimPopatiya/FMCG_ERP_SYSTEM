import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/lib/api/salesOrders";

const PAGE_SIZE = 20;

export function useOrders() {
  return useInfiniteQuery({
    queryKey: ["orders"],
    queryFn: ({ pageParam }) => listOrders(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}
