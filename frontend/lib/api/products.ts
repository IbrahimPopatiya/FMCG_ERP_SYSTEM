import { api } from "@/lib/api/client";
import type {
  ProductCatalogResponse,
  ProductCreate,
  ProductResponse,
  ProductUpdate,
} from "@/types/product";
import type { Page } from "@/types/pagination";

export function listProducts() {
  return api.get<ProductCatalogResponse[]>("/products").then((res) => res.data);
}

export function listProductsForManagement(page: number, pageSize: number) {
  return api
    .get<Page<ProductResponse>>("/products/manage", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getProduct(productId: string) {
  return api.get<ProductResponse>(`/products/${productId}`).then((res) => res.data);
}

export function createProduct(data: ProductCreate) {
  return api.post<ProductResponse>("/products", data).then((res) => res.data);
}

export function updateProduct(productId: string, data: ProductUpdate) {
  return api.patch<ProductResponse>(`/products/${productId}`, data).then((res) => res.data);
}

export function setProductStatus(productId: string, status: "active" | "inactive") {
  return api
    .patch<ProductResponse>(`/products/${productId}/status`, { status })
    .then((res) => res.data);
}

export function deleteProduct(productId: string) {
  return api.delete(`/products/${productId}`).then((res) => res.data);
}
