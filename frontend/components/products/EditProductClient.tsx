"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ProductForm, type ProductFormValues } from "@/components/products/ProductForm";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { useProduct } from "@/lib/hooks/useProduct";
import { useSetProductStatus, useUpdateProduct } from "@/lib/hooks/useProductMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { ProductResponse } from "@/types/product";

function toFormValues(product: ProductResponse): ProductFormValues {
  return {
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category_id: product.category_id ?? "",
    brand_id: product.brand_id ?? "",
    unit: product.unit,
    packing: product.packing,
    mrp: String(product.mrp),
    selling_price: String(product.selling_price),
    gst_rate: String(product.gst_rate),
    minimum_stock: String(product.minimum_stock),
  };
}

export function EditProductClient({ productId }: { productId: string }) {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const { data: product, isLoading, isError } = useProduct(productId);
  const updateProduct = useUpdateProduct(productId);
  const setStatus = useSetProductStatus();

  return (
    <div>
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <Link href="/admin/products" className="text-sm font-medium text-ink-muted hover:text-ink">
            ← Products
          </Link>
          <div className="mt-1 flex items-center gap-2.5">
            <h1 className="text-lg font-semibold tracking-tight text-ink">
              {product ? product.name : "Edit product"}
            </h1>
            {product && <ProductStatusBadge status={product.status} />}
          </div>
        </div>
        {product && (
          <Button
            type="button"
            variant="secondary"
            isLoading={setStatus.isPending}
            className="w-full sm:w-auto"
            onClick={() =>
              setStatus.mutate({
                productId,
                status: product.status === "active" ? "inactive" : "active",
              })
            }
          >
            {product.status === "active" ? "Deactivate product" : "Activate product"}
          </Button>
        )}
      </header>

      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        {isLoading && (
          <div className="flex flex-col gap-4">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        )}

        {isError && (
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this product. It may not exist anymore.
          </div>
        )}

        {product && (
          <ProductForm
            initialValues={toFormValues(product)}
            submitLabel="Save changes"
            onSubmit={async (payload) => {
              const updated = await updateProduct.mutateAsync(payload);
              router.push("/admin/products");
              return updated;
            }}
          />
        )}
      </div>
    </div>
  );
}
