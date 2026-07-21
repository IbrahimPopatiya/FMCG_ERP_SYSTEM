import { api } from "@/lib/api/client";
import type { Page } from "@/types/pagination";
import type { InvoiceListItem } from "@/types/invoices";

export function listInvoices(page: number, pageSize: number) {
  return api
    .get<Page<InvoiceListItem>>("/invoices", { params: { page, page_size: pageSize } })
    .then((res) => res.data);
}

export function getInvoice(invoiceId: string) {
  return api.get<InvoiceListItem>(`/invoices/${invoiceId}`).then((res) => res.data);
}
