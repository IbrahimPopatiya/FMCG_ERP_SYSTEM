import { useQuery } from "@tanstack/react-query";
import { listPosts } from "@/lib/api/posts";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: listPosts,
  });
}
