import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createWarehouse, setWarehouseStatus } from "@/lib/api/warehouses";
import type { WarehouseCreate, WarehouseStatus } from "@/types/warehouses";

export function useCreateWarehouse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: WarehouseCreate) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}

export function useSetWarehouseStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ warehouseId, status }: { warehouseId: string; status: WarehouseStatus }) =>
      setWarehouseStatus(warehouseId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
}
