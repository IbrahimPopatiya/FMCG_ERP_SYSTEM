import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type {
  PurchaseCancelResponse,
  PurchaseCreate,
  PurchaseReceiveItem,
  PurchaseReceiveResponse,
  PurchaseResponse,
} from "@/types/purchases";

export function listPurchases(page: number, pageSize: number) {
  return api
    .get<Page<PurchaseResponse>>("/purchases", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getPurchase(purchaseId: string) {
  return api.get<PurchaseResponse>(`/purchases/${purchaseId}`).then((res) => res.data);
}

export function createPurchase(data: PurchaseCreate) {
  return api.post<PurchaseResponse>("/purchases", data).then((res) => res.data);
}

export function receivePurchase(purchaseId: string, items: PurchaseReceiveItem[]) {
  return api
    .post<PurchaseReceiveResponse>(`/purchases/${purchaseId}/receive`, { items })
    .then((res) => res.data);
}

export function cancelPurchase(purchaseId: string) {
  return api
    .post<PurchaseCancelResponse>(`/purchases/${purchaseId}/cancel`, {})
    .then((res) => res.data);
}
