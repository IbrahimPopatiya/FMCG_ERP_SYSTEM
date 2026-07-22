"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { CustomerProductCard } from "@/components/products/CustomerProductCard";
import { useCart } from "@/components/cart/CartProvider";
import { useCategories } from "@/lib/hooks/useCategories";
import { useProducts } from "@/lib/hooks/useProducts";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:grid-cols-4">
      {Array.from({ length: 8 }).map((_, i) => (
        <Skeleton key={i} className="aspect-[3/4] w-full rounded-xl" />
      ))}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <ProductsPageContent />
    </Suspense>
  );
}

function ProductsPageContent() {
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(searchParams.get("category"));

  const products = useProducts();
  const categories = useCategories();
  const { getQty, addItem, setQty } = useCart();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (products.data ?? []).filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (!query) return true;
      return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    });
  }, [products.data, search, categoryId]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold tracking-tight text-ink">Products</h1>
          <Link href="/cart" className="text-sm font-medium text-primary hover:text-primary-hover">
            View cart
          </Link>
        </div>
        <input
          type="search"
          placeholder="Search products…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full rounded-lg border border-border px-3.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        {activeCategories.length > 0 && (
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                categoryId === null
                  ? "border-primary bg-primary text-white"
                  : "border-border text-ink-muted hover:bg-surface"
              }`}
            >
              All
            </button>
            {activeCategories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  categoryId === c.id
                    ? "border-primary bg-primary text-white"
                    : "border-border text-ink-muted hover:bg-surface"
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {products.isLoading && <SkeletonGrid />}

      {products.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load products. Pull down to refresh.
          </div>
        </div>
      )}

      {!products.isLoading && !products.isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No products found</p>
          <p className="text-sm text-ink-muted">Try a different search or category.</p>
        </div>
      )}

      {!products.isLoading && !products.isError && filtered.length > 0 && (
        <div className="grid grid-cols-2 gap-3 p-4 pb-6 sm:grid-cols-3 md:grid-cols-4">
          {filtered.map((product) => (
            <CustomerProductCard
              key={product.id}
              product={product}
              qty={getQty(product.id)}
              onQtyChange={(qty) => {
                if (qty === 0) setQty(product.id, 0);
                else if (getQty(product.id) === 0) addItem(product, qty);
                else setQty(product.id, qty);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
