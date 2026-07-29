import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type {
  PaymentCreate,
  PaymentListItem,
  PaymentResponse,
  PaymentStatusResponse,
} from "@/types/payments";

export function listPayments(page: number, pageSize: number) {
  return api
    .get<Page<PaymentListItem>>("/payments", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getPayment(paymentId: string) {
  return api.get<PaymentListItem>(`/payments/${paymentId}`).then((res) => res.data);
}

export function recordPayment(data: PaymentCreate) {
  return api.post<PaymentResponse>("/payments", data).then((res) => res.data);
}

export function verifyPayment(paymentId: string) {
  return api.post<PaymentStatusResponse>(`/payments/${paymentId}/verify`, {}).then((res) => res.data);
}

export function bouncePayment(paymentId: string, reason: string) {
  return api
    .post<PaymentStatusResponse>(`/payments/${paymentId}/bounce`, { reason })
    .then((res) => res.data);
}
