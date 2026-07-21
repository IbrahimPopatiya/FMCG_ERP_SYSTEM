import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelInvoice, generateInvoice } from "@/lib/api/invoices";

export function useCancelInvoice(invoiceId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => cancelInvoice(invoiceId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}

export function useGenerateInvoice(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => generateInvoice(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });
}
