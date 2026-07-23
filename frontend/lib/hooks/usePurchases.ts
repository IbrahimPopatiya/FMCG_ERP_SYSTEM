import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPurchase, listPurchases } from "@/lib/api/purchases";

const PAGE_SIZE = 20;

export function usePurchasesManage() {
  return useInfiniteQuery({
    queryKey: ["purchases", "manage"],
    queryFn: ({ pageParam }) => listPurchases(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function usePurchase(purchaseId: string) {
  return useQuery({
    queryKey: ["purchases", purchaseId],
    queryFn: () => getPurchase(purchaseId),
    enabled: !!purchaseId,
  });
}
