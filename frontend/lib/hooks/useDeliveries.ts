import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getDelivery, listDeliveries } from "@/lib/api/deliveries";

const PAGE_SIZE = 20;

export function useDeliveriesManage() {
  return useInfiniteQuery({
    queryKey: ["deliveries", "manage"],
    queryFn: ({ pageParam }) => listDeliveries(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useDelivery(deliveryId: string) {
  return useQuery({
    queryKey: ["deliveries", deliveryId],
    queryFn: () => getDelivery(deliveryId),
    enabled: !!deliveryId,
  });
}

const DELIVERY_SAMPLE_SIZE = 100;

// Feeds the "create delivery" invoice picker (to exclude invoices that
// already have one) - capped sample, not a source of truth.
export function useDeliverySample() {
  return useQuery({
    queryKey: ["deliveries", "manage", "create-sample"],
    queryFn: () => listDeliveries(1, DELIVERY_SAMPLE_SIZE),
  });
}
