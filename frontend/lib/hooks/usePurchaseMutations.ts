import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cancelPurchase, createPurchase, receivePurchase } from "@/lib/api/purchases";
import type { PurchaseCreate, PurchaseReceiveItem } from "@/types/purchases";

function invalidatePurchases(queryClient: ReturnType<typeof useQueryClient>, purchaseId?: string) {
  queryClient.invalidateQueries({ queryKey: ["purchases"] });
  if (purchaseId) queryClient.invalidateQueries({ queryKey: ["purchases", purchaseId] });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PurchaseCreate) => createPurchase(data),
    onSuccess: () => invalidatePurchases(queryClient),
  });
}

export function useReceivePurchase(purchaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: PurchaseReceiveItem[]) => receivePurchase(purchaseId, items),
    onSuccess: () => invalidatePurchases(queryClient, purchaseId),
  });
}

export function useCancelPurchase(purchaseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => cancelPurchase(purchaseId),
    onSuccess: () => invalidatePurchases(queryClient, purchaseId),
  });
}
