import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addPriceListItem,
  createPriceList,
  deletePriceList,
  removePriceListItem,
  updatePriceListItem,
} from "@/lib/api/priceLists";
import type { PriceListCreate, PriceListItemCreate } from "@/types/priceLists";

export function useCreatePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceListCreate) => createPriceList(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useDeletePriceList() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (priceListId: string) => deletePriceList(priceListId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists"] });
    },
  });
}

export function useAddPriceListItem(priceListId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PriceListItemCreate) => addPriceListItem(priceListId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists", priceListId, "items"] });
    },
  });
}

export function useUpdatePriceListItem(priceListId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ itemId, discountPercent }: { itemId: string; discountPercent: number }) =>
      updatePriceListItem(priceListId, itemId, discountPercent),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists", priceListId, "items"] });
    },
  });
}

export function useRemovePriceListItem(priceListId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) => removePriceListItem(priceListId, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["priceLists", priceListId, "items"] });
    },
  });
}
