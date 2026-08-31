import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getOrder, listOrderDates, listOrders } from "@/lib/api/salesOrders";

const PAGE_SIZE = 10;

export function useOrders(customerId?: string, orderDate?: string, onlyMine?: boolean) {
  return useInfiniteQuery({
    queryKey: ["orders", customerId ?? null, orderDate ?? null, !!onlyMine],
    queryFn: ({ pageParam }) => listOrders(pageParam, PAGE_SIZE, customerId, orderDate, onlyMine),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useOrderDates(onlyMine?: boolean) {
  return useQuery({
    queryKey: ["orders", "dates", !!onlyMine],
    queryFn: () => listOrderDates(onlyMine),
  });
}

export function useOrder(orderId: string) {
  return useQuery({
    queryKey: ["orders", orderId],
    queryFn: () => getOrder(orderId),
    enabled: !!orderId,
  });
}
