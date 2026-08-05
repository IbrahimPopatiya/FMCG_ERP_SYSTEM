import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/lib/api/salesOrders";

const PAGE_SIZE = 10;

export function useOrders(customerId?: string) {
  return useInfiniteQuery({
    queryKey: ["orders", customerId ?? null],
    queryFn: ({ pageParam }) => listOrders(pageParam, PAGE_SIZE, customerId),
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
