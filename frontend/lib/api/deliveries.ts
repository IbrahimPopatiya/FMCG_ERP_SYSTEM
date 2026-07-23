import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type {
  DeliveryCompleteRequest,
  DeliveryCompleteResponse,
  DeliveryCreate,
  DeliveryListItem,
  DeliveryResponse,
} from "@/types/deliveries";

export function listDeliveries(page: number, pageSize: number) {
  return api
    .get<Page<DeliveryListItem>>("/deliveries", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getDelivery(deliveryId: string) {
  return api.get<DeliveryListItem>(`/deliveries/${deliveryId}`).then((res) => res.data);
}

export function createDelivery(data: DeliveryCreate) {
  return api.post<DeliveryResponse>("/deliveries", data).then((res) => res.data);
}

export function startDelivery(deliveryId: string) {
  return api.post<DeliveryResponse>(`/deliveries/${deliveryId}/start`, {}).then((res) => res.data);
}

export function completeDelivery(deliveryId: string, data: DeliveryCompleteRequest) {
  return api
    .post<DeliveryCompleteResponse>(`/deliveries/${deliveryId}/complete`, data)
    .then((res) => res.data);
}

export function failDelivery(deliveryId: string, reason: string) {
  return api.post<DeliveryResponse>(`/deliveries/${deliveryId}/fail`, { reason }).then((res) => res.data);
}
