import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createInventoryAdjustment, createInventoryTransfer } from "@/lib/api/inventory";
import type { InventoryAdjustmentCreate, InventoryTransferCreate } from "@/types/inventory";

export function useCreateInventoryAdjustment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InventoryAdjustmentCreate) => createInventoryAdjustment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}

export function useCreateInventoryTransfer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: InventoryTransferCreate) => createInventoryTransfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
  });
}
