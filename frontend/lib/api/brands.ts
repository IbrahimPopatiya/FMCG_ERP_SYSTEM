import { api } from "@/lib/api/client";
import type { BrandCreate, BrandDeleteResponse, BrandResponse } from "@/types/brands";

export function listBrands() {
  return api.get<BrandResponse[]>("/brands").then((res) => res.data);
}

export function createBrand(data: BrandCreate) {
  return api.post<BrandResponse>("/brands", data).then((res) => res.data);
}

export function deleteBrand(brandId: string) {
  return api.delete<BrandDeleteResponse>(`/brands/${brandId}`).then((res) => res.data);
}
