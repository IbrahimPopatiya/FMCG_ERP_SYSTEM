import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeDelivery, createDelivery, failDelivery, startDelivery } from "@/lib/api/deliveries";
import type { DeliveryCompleteRequest, DeliveryCreate } from "@/types/deliveries";

function invalidateDeliveries(queryClient: ReturnType<typeof useQueryClient>, deliveryId?: string) {
  queryClient.invalidateQueries({ queryKey: ["deliveries"] });
  if (deliveryId) queryClient.invalidateQueries({ queryKey: ["deliveries", deliveryId] });
}

export function useCreateDelivery() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeliveryCreate) => createDelivery(data),
    onSuccess: () => invalidateDeliveries(queryClient),
  });
}

export function useStartDelivery(deliveryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startDelivery(deliveryId),
    onSuccess: () => invalidateDeliveries(queryClient, deliveryId),
  });
}

export function useCompleteDelivery(deliveryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeliveryCompleteRequest) => completeDelivery(deliveryId, data),
    onSuccess: () => invalidateDeliveries(queryClient, deliveryId),
  });
}

export function useFailDelivery(deliveryId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reason: string) => failDelivery(deliveryId, reason),
    onSuccess: () => invalidateDeliveries(queryClient, deliveryId),
  });
}
