import { api } from "@/lib/api/client";
import type { CategoryCreate, CategoryDeleteResponse, CategoryResponse } from "@/types/categories";

export function listCategories() {
  return api.get<CategoryResponse[]>("/categories").then((res) => res.data);
}

export function createCategory(data: CategoryCreate) {
  return api.post<CategoryResponse>("/categories", data).then((res) => res.data);
}

export function deleteCategory(categoryId: string) {
  return api.delete<CategoryDeleteResponse>(`/categories/${categoryId}`).then((res) => res.data);
}
