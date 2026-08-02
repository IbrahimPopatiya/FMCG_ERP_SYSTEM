import { api } from "@/lib/api/client";
import type { ProductCatalogResponse } from "@/types/product";
import type { Page } from "@/types/pagination";

export interface ForYouFeedParams {
  page: number;
  pageSize: number;
}

export function getForYouFeed({ page, pageSize }: ForYouFeedParams) {
  return api
    .get<Page<ProductCatalogResponse>>("/recommendations/for-me", {
      params: { page, page_size: pageSize },
    })
    .then((res) => res.data);
}

export function postImpressions(productIds: string[]) {
  return api.post("/recommendations/impressions", { product_ids: productIds });
}
