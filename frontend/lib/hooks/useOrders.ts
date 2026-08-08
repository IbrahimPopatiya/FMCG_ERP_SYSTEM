import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getOrder, listOrders } from "@/lib/api/salesOrders";

const PAGE_SIZE = 10;

export function useOrders(customerId?: string, orderDate?: string) {
  return useInfiniteQuery({
    queryKey: ["orders", customerId ?? null, orderDate ?? null],
    queryFn: ({ pageParam }) => listOrders(pageParam, PAGE_SIZE, customerId, orderDate),
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
