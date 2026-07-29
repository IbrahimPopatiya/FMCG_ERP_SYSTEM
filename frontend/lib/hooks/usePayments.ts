import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getPayment, listPayments } from "@/lib/api/payments";

const PAGE_SIZE = 20;

export function usePaymentsManage() {
  return useInfiniteQuery({
    queryKey: ["payments", "manage"],
    queryFn: ({ pageParam }) => listPayments(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function usePayment(paymentId: string) {
  return useQuery({
    queryKey: ["payments", paymentId],
    queryFn: () => getPayment(paymentId),
    enabled: !!paymentId,
  });
}
