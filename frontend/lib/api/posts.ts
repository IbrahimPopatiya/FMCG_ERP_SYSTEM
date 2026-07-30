import { api } from "@/lib/api/client";
import type { PostCreate, PostResponse } from "@/types/post";

export function listPosts() {
  return api.get<PostResponse[]>("/posts").then((res) => res.data);
}

export function listAllPosts() {
  return api.get<PostResponse[]>("/posts/admin").then((res) => res.data);
}

export function createPost(data: PostCreate) {
  return api.post<PostResponse>("/posts", data).then((res) => res.data);
}

export function setPostStatus(postId: string, isActive: boolean) {
  return api
    .patch<PostResponse>(`/posts/${postId}/status`, { is_active: isActive })
    .then((res) => res.data);
}

export function repostPost(postId: string) {
  return api.post<PostResponse>(`/posts/${postId}/repost`).then((res) => res.data);
}
