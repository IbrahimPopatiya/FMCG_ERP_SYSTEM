import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listAllPosts, listPosts } from "@/lib/api/posts";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: listPosts,
  });
}

// Infinite-scrolls the admin Posts screen, matching every other admin list
// (Products, Customers, Orders) instead of click-through pagination - a flat
// page size otherwise silently hides everything past the first page.
export function useAllPosts(pageSize: number, search?: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "admin", pageSize, search ?? ""],
    queryFn: ({ pageParam }) => listAllPosts({ page: pageParam, pageSize, search }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
