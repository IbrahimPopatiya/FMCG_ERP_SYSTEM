import { useQuery } from "@tanstack/react-query";
import { listAllPosts, listPosts } from "@/lib/api/posts";

export function usePosts() {
  return useQuery({
    queryKey: ["posts"],
    queryFn: listPosts,
  });
}

// Admin-only listing — includes inactive posts, for the Posts management screen.
export function useAdminPosts() {
  return useQuery({
    queryKey: ["posts", "admin"],
    queryFn: listAllPosts,
  });
}
