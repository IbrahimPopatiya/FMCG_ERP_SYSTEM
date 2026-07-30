"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/layout/TopBar";
import { ProductForm } from "@/components/products/ProductForm";
import { useCreateProduct } from "@/lib/hooks/useProductMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function NewProductPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const createProduct = useCreateProduct();

  return (
    <div>
      <TopBar title="Add Product" subtitle="Add a new item to the catalog" backHref="/admin/products" />

      <div className="mx-auto max-w-2xl p-4 sm:p-6">
        <ProductForm
          submitLabel="Save product"
          onSubmit={async (payload) => {
            const product = await createProduct.mutateAsync(payload);
            router.push("/admin/products");
            return product;
          }}
        />
      </div>
    </div>
  );
}
