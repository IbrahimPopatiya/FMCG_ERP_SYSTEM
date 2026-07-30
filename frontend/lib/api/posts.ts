import { api } from "@/lib/api/client";
import type { PostCreate, PostResponse } from "@/types/post";

export function listPosts() {
  return api.get<PostResponse[]>("/posts").then((res) => res.data);
}

export function createPost(data: PostCreate) {
  return api.post<PostResponse>("/posts", data).then((res) => res.data);
}
