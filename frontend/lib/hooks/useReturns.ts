import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getReturn, listReturns } from "@/lib/api/returns";

const PAGE_SIZE = 20;

export function useReturnsManage() {
  return useInfiniteQuery({
    queryKey: ["returns", "manage"],
    queryFn: ({ pageParam }) => listReturns(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useReturn(returnId: string) {
  return useQuery({
    queryKey: ["returns", returnId],
    queryFn: () => getReturn(returnId),
    enabled: !!returnId,
  });
}
