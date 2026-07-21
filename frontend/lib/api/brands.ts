import { api } from "@/lib/api/client";
import type { BrandResponse } from "@/types/brands";

export function listBrands() {
  return api.get<BrandResponse[]>("/brands").then((res) => res.data);
}
