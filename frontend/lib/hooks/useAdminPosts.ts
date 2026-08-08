import { useInfiniteQuery } from "@tanstack/react-query";
import { listAllPosts } from "@/lib/api/posts";

const PAGE_SIZE = 20;

// Powers the admin Posts screen's scrollable list — newest first, including
// inactive posts (unlike the customer feed's /posts, which is active-only).
export function useAdminPosts(search: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "manage", search],
    queryFn: ({ pageParam }) => listAllPosts(pageParam, PAGE_SIZE, search),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
