import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createProduct,
  deleteProduct,
  setProductStatus,
  updateProduct,
} from "@/lib/api/products";
import type { ProductCreate, ProductResponse, ProductUpdate } from "@/types/product";
import type { Page } from "@/types/pagination";
import type { InfiniteData } from "@tanstack/react-query";

// Patches the updated product into every cached "products" list in place -
// avoids the full refetch (and the resulting flash while the image
// re-downloads) that queryClient.invalidateQueries would otherwise trigger.
function patchProductInCaches(queryClient: ReturnType<typeof useQueryClient>, updated: ProductResponse) {
  queryClient.setQueriesData<InfiniteData<Page<ProductResponse>>>(
    { queryKey: ["products", "manage"] },
    (data) => {
      if (!data) return data;
      return {
        ...data,
        pages: data.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === updated.id ? updated : item)),
        })),
      };
    }
  );
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCreate) => createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct(productId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductUpdate) => updateProduct(productId, data),
    onSuccess: (updated) => {
      patchProductInCaches(queryClient, updated);
      queryClient.invalidateQueries({ queryKey: ["products", "feed"] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (productId: string) => deleteProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useSetProductStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ productId, status }: { productId: string; status: "active" | "inactive" }) =>
      setProductStatus(productId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
