import { api } from "@/lib/api/client";
import type {
  PriceListCreate,
  PriceListDeleteResponse,
  PriceListItemCreate,
  PriceListItemRemoveResponse,
  PriceListItemResponse,
  PriceListResponse,
} from "@/types/priceLists";

export function listPriceLists() {
  return api.get<PriceListResponse[]>("/price-lists").then((res) => res.data);
}

export function getPriceList(priceListId: string) {
  return api.get<PriceListResponse>(`/price-lists/${priceListId}`).then((res) => res.data);
}

export function listPriceListItems(priceListId: string) {
  return api
    .get<PriceListItemResponse[]>(`/price-lists/${priceListId}/items`)
    .then((res) => res.data);
}

export function createPriceList(data: PriceListCreate) {
  return api.post<PriceListResponse>("/price-lists", data).then((res) => res.data);
}

export function deletePriceList(priceListId: string) {
  return api.delete<PriceListDeleteResponse>(`/price-lists/${priceListId}`).then((res) => res.data);
}

export function addPriceListItem(priceListId: string, data: PriceListItemCreate) {
  return api
    .post<PriceListItemResponse>(`/price-lists/${priceListId}/items`, data)
    .then((res) => res.data);
}

export function updatePriceListItem(priceListId: string, itemId: string, discountPercent: number) {
  return api
    .patch<PriceListItemResponse>(`/price-lists/${priceListId}/items/${itemId}`, {
      discount_percent: discountPercent,
    })
    .then((res) => res.data);
}

export function removePriceListItem(priceListId: string, itemId: string) {
  return api
    .delete<PriceListItemRemoveResponse>(`/price-lists/${priceListId}/items/${itemId}`)
    .then((res) => res.data);
}
