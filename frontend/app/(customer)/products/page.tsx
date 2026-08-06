"use client";

import { ProductsListPage } from "@/components/shared/ProductsListPage";
import { CustomerProductCard } from "@/components/products/CustomerProductCard";
import { BoxIcon } from "@/components/customer/icons";

export default function ProductsPage() {
  return (
    <ProductsListPage
      headerSlot={
        <div className="mb-3 flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <BoxIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold tracking-tight text-ink">Products</p>
            <p className="text-xs text-ink-muted">Shop from our full catalog</p>
          </div>
        </div>
      }
      renderCard={(product, qty, onQtyChange) => (
        <CustomerProductCard key={product.id} product={product} qty={qty} onQtyChange={onQtyChange} />
      )}
    />
  );
}
