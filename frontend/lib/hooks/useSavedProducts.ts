import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listSavedProducts, saveProduct, unsaveProduct } from "@/lib/api/savedProducts";
import type { ProductCatalogResponse, SavedProductResponse } from "@/types/product";

const SAVED_PRODUCTS_KEY = ["saved-products"];

export function useSavedProducts() {
  return useQuery({
    queryKey: SAVED_PRODUCTS_KEY,
    queryFn: listSavedProducts,
  });
}

// Bookmark toggle for the Home reel's Save button — optimistically flips the
// saved list in the query cache so the icon updates instantly, then
// reconciles with the server response (or rolls back on failure).
export function useToggleSavedProduct() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: (product: ProductCatalogResponse) => saveProduct(product.id),
    onMutate: async (product) => {
      await queryClient.cancelQueries({ queryKey: SAVED_PRODUCTS_KEY });
      const previous = queryClient.getQueryData<SavedProductResponse[]>(SAVED_PRODUCTS_KEY);
      queryClient.setQueryData<SavedProductResponse[]>(SAVED_PRODUCTS_KEY, (current) => [
        { id: product.id, product, created_at: new Date().toISOString() },
        ...(current ?? []).filter((s) => s.product.id !== product.id),
      ]);
      return { previous };
    },
    onError: (_err, _product, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_PRODUCTS_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_PRODUCTS_KEY });
    },
  });

  const unsave = useMutation({
    mutationFn: (productId: string) => unsaveProduct(productId),
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: SAVED_PRODUCTS_KEY });
      const previous = queryClient.getQueryData<SavedProductResponse[]>(SAVED_PRODUCTS_KEY);
      queryClient.setQueryData<SavedProductResponse[]>(SAVED_PRODUCTS_KEY, (current) =>
        (current ?? []).filter((s) => s.product.id !== productId)
      );
      return { previous };
    },
    onError: (_err, _productId, context) => {
      if (context?.previous) queryClient.setQueryData(SAVED_PRODUCTS_KEY, context.previous);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: SAVED_PRODUCTS_KEY });
    },
  });

  function toggle(product: ProductCatalogResponse, isSaved: boolean) {
    if (isSaved) {
      unsave.mutate(product.id);
    } else {
      save.mutate(product);
    }
  }

  return { toggle };
}
