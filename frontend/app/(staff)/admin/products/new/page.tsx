"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ProductForm } from "@/components/products/ProductForm";
import { useCreateProduct } from "@/lib/hooks/useProductMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

export default function NewProductPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const createProduct = useCreateProduct();

  return (
    <div>
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <Link href="/admin/products" className="text-sm font-medium text-ink-muted hover:text-ink">
          ← Products
        </Link>
        <h1 className="mt-1 text-lg font-semibold tracking-tight text-ink">Add product</h1>
        <p className="mt-0.5 text-sm text-ink-muted">
          Add a new item to the catalog. It appears for customers once saved.
        </p>
      </header>

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
