import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { getInvoice, listInvoices } from "@/lib/api/invoices";

const PAGE_SIZE = 20;

export function useInvoicesManage() {
  return useInfiniteQuery({
    queryKey: ["invoices", "manage"],
    queryFn: ({ pageParam }) => listInvoices(pageParam, PAGE_SIZE),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const loaded = lastPage.page * lastPage.page_size;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
  });
}

export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: ["invoices", invoiceId],
    queryFn: () => getInvoice(invoiceId),
    enabled: !!invoiceId,
  });
}

const UNDELIVERED_INVOICE_SAMPLE_SIZE = 100;

// Feeds the "create delivery" invoice picker - capped sample, not a source
// of truth (the Invoices screen is).
export function useInvoiceSample() {
  return useQuery({
    queryKey: ["invoices", "manage", "delivery-sample"],
    queryFn: () => listInvoices(1, UNDELIVERED_INVOICE_SAMPLE_SIZE),
  });
}
