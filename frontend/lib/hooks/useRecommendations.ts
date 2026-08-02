import { useInfiniteQuery } from "@tanstack/react-query";
import { getForYouFeed } from "@/lib/api/recommendations";

const FOR_YOU_PAGE_SIZE = 12;

// Personalized home feed - not capped, pages through the whole active
// catalog as the customer keeps scrolling (see useInfiniteScrollSentinel /
// the reel's near-end fetchNextPage trigger for how pages get requested).
export function useForYouFeed() {
  return useInfiniteQuery({
    queryKey: ["recommendations", "for-me"],
    queryFn: ({ pageParam }) => getForYouFeed({ page: pageParam, pageSize: FOR_YOU_PAGE_SIZE }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    // Only customers get a personalized feed - a staff token 403s here,
    // which is expected and shouldn't retry or surface as a page error.
    retry: false,
  });
}
