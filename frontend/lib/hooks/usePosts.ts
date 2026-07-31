import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { listAllPosts, listPosts } from "@/lib/api/posts";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: listPosts,
  });
}

const ADMIN_POSTS_PAGE_SIZE = 10;

// Admin-only listing — includes inactive posts, for the Posts management screen.
export function useAdminPosts(search: string) {
  return useInfiniteQuery({
    queryKey: ["posts", "admin", search],
    queryFn: ({ pageParam }) => listAllPosts(pageParam, ADMIN_POSTS_PAGE_SIZE, search || undefined),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}
