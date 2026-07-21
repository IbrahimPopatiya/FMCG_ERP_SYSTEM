import { api } from "@/lib/api/client";
import type { CategoryResponse } from "@/types/categories";

export function listCategories() {
  return api.get<CategoryResponse[]>("/categories").then((res) => res.data);
}
