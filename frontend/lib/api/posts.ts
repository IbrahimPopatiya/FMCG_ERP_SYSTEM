import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type { PostCreate, PostResponse } from "@/types/post";

export function listPosts() {
  return api.get<PostResponse[]>("/posts").then((res) => res.data);
}

export function listAllPosts(params: { page: number; pageSize: number; search?: string }) {
  return api
    .get<Page<PostResponse>>("/posts/admin", {
      params: { page: params.page, page_size: params.pageSize, search: params.search || undefined },
    })
    .then((res) => res.data);
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

export function repostPosts(postIds: string[]) {
  return api.post<PostResponse[]>("/posts/repost", { post_ids: postIds }).then((res) => res.data);
}
