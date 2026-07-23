import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bouncePayment, recordPayment, verifyPayment } from "@/lib/api/payments";
import type { PaymentCreate } from "@/types/payments";

function invalidatePayments(queryClient: ReturnType<typeof useQueryClient>, paymentId?: string) {
  queryClient.invalidateQueries({ queryKey: ["payments"] });
  queryClient.invalidateQueries({ queryKey: ["invoices"] });
  if (paymentId) queryClient.invalidateQueries({ queryKey: ["payments", paymentId] });
}

export function useRecordPayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PaymentCreate) => recordPayment(data),
    onSuccess: () => invalidatePayments(queryClient),
  });
}

export function useVerifyPayment(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => verifyPayment(paymentId),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  });
}

export function useBouncePayment(paymentId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => bouncePayment(paymentId, reason),
    onSuccess: () => invalidatePayments(queryClient, paymentId),
  });
}
