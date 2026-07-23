import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type { InvoiceCancelResponse, InvoiceListItem, InvoiceResponse } from "@/types/invoices";

export function listInvoices(page: number, pageSize: number) {
  return api
    .get<Page<InvoiceListItem>>("/invoices", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getInvoice(invoiceId: string) {
  return api.get<InvoiceListItem>(`/invoices/${invoiceId}`).then((res) => res.data);
}

export function cancelInvoice(invoiceId: string, reason: string) {
  return api
    .post<InvoiceCancelResponse>(`/invoices/${invoiceId}/cancel`, { reason })
    .then((res) => res.data);
}

export function generateInvoice(orderId: string) {
  return api.post<InvoiceResponse>(`/orders/${orderId}/invoice`).then((res) => res.data);
}
