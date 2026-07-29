import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createBrand, deleteBrand } from "@/lib/api/brands";
import type { BrandCreate } from "@/types/brands";

export function useCreateBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: BrandCreate) => createBrand(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}

export function useDeleteBrand() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (brandId: string) => deleteBrand(brandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["brands"] });
    },
  });
}
