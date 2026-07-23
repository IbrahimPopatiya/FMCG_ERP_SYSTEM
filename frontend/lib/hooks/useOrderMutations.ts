import { useMutation, useQueryClient } from "@tanstack/react-query";
import { approveOrder, cancelOrder, createOrder, loadOrder } from "@/lib/api/salesOrders";
import type { SalesOrderApproveItem, SalesOrderCreate, SalesOrderLoadItem } from "@/types/salesOrder";

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SalesOrderCreate) => createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (orderId: string) => cancelOrder(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useApproveOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: SalesOrderApproveItem[]) => approveOrder(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}

export function useLoadOrder(orderId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: SalesOrderLoadItem[]) => loadOrder(orderId, items),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders"] });
    },
  });
}
