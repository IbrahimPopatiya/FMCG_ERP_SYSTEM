import { useQuery } from "@tanstack/react-query";
import { listAllPosts, listPosts } from "@/lib/api/posts";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: listPosts,
  });
}

export function useAllPosts(params: { page: number; pageSize: number; search?: string }) {
  return useQuery({
    queryKey: ["posts", "admin", params],
    queryFn: () => listAllPosts(params),
  });
}
