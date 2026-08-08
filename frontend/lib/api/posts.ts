import { api } from "@/lib/api/client";
import type { PostCreate, PostResponse } from "@/types/post";
import type { Page } from "@/types/pagination";

export function listPosts() {
  return api.get<PostResponse[]>("/posts").then((res) => res.data);
}

export function listAllPosts(page: number, pageSize: number, search: string) {
  return api
    .get<Page<PostResponse>>("/posts/admin", { params: { page, page_size: pageSize, search: search || undefined } })
    .then((res) => res.data);
}

export function createPost(data: PostCreate) {
  return api.post<PostResponse>("/posts", data).then((res) => res.data);
}

export function setPostStatus(postId: string, isActive: boolean) {
  return api.patch<PostResponse>(`/posts/${postId}/status`, { is_active: isActive }).then((res) => res.data);
}

export function repostPost(postId: string) {
  return api.post<PostResponse>(`/posts/${postId}/repost`).then((res) => res.data);
}
