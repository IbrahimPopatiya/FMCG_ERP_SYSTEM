"use client";

import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerProductCard } from "@/components/products/CustomerProductCard";
import { BackArrowIcon, BookmarkIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useSavedProducts } from "@/lib/hooks/useSavedProducts";
import type { ProductCatalogResponse } from "@/types/product";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-8 lg:grid-cols-5">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function SavedProductsPage() {
  const router = useRouter();
  const savedProducts = useSavedProducts();
  const { getQty, addItem, setQty } = useCart();

  function handleQtyChange(product: ProductCatalogResponse, qty: number) {
    if (qty === 0) setQty(product.id, 0);
    else if (getQty(product.id) === 0) addItem(product, qty);
    else setQty(product.id, qty);
  }

  const items = savedProducts.data ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
        >
          <BackArrowIcon className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold tracking-tight text-ink">Saved Products</h1>
      </header>

      {savedProducts.isLoading && <SkeletonGrid />}

      {savedProducts.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load your saved products.
          </div>
        </div>
      )}

      {!savedProducts.isLoading && !savedProducts.isError && items.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
            <BookmarkIcon className="h-6 w-6" />
          </span>
          <p className="text-sm font-medium text-ink">No saved products yet</p>
          <p className="text-xs text-ink-muted">
            Tap the bookmark icon on a product in your Home feed to save it here.
          </p>
        </div>
      )}

      {!savedProducts.isLoading && !savedProducts.isError && items.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-8 lg:grid-cols-5">
          {items.map((saved) => (
            <CustomerProductCard
              key={saved.id}
              product={saved.product}
              qty={getQty(saved.product.id)}
              onQtyChange={handleQtyChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}
