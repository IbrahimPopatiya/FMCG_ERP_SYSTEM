import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createSupplier, setSupplierStatus } from "@/lib/api/suppliers";
import type { SupplierCreate, SupplierStatus } from "@/types/suppliers";

export function useCreateSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: SupplierCreate) => createSupplier(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}

export function useSetSupplierStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, status }: { supplierId: string; status: SupplierStatus }) =>
      setSupplierStatus(supplierId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
}
