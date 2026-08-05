import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createPost, repostPost, repostPosts, setPostStatus } from "@/lib/api/posts";
import type { PostCreate } from "@/types/post";

export function useCreatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PostCreate) => createPost(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useSetPostStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ postId, isActive }: { postId: string; isActive: boolean }) =>
      setPostStatus(postId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useRepostPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postId: string) => repostPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}

export function useRepostPosts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (postIds: string[]) => repostPosts(postIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
    },
  });
}
