import { api } from "@/lib/api/client";
import type { SavedProductResponse } from "@/types/product";

export function listSavedProducts() {
  return api.get<SavedProductResponse[]>("/saved-products").then((res) => res.data);
}

export function saveProduct(productId: string) {
  return api
    .post<SavedProductResponse>("/saved-products", { product_id: productId })
    .then((res) => res.data);
}

export function unsaveProduct(productId: string) {
  return api.delete(`/saved-products/${productId}`).then(() => undefined);
}
