"use client";

import Image from "next/image";
import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { CustomerProductCard } from "@/components/products/CustomerProductCard";
import { MenuButton } from "@/components/customer/CustomerMenu";
import { AccountAvatar } from "@/components/customer/AccountAvatar";
import { SearchIcon, FilterIcon, CategoryAllIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useCategories } from "@/lib/hooks/useCategories";
import { useProducts } from "@/lib/hooks/useProducts";

type SortOption = "popular" | "price_low" | "price_high" | "name";

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 p-4 md:grid-cols-4 md:p-8 lg:grid-cols-5">
      {Array.from({ length: 9 }).map((_, i) => (
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
  const [sort, setSort] = useState<SortOption>("popular");

  const products = useProducts();
  const categories = useCategories();
  const { getQty, addItem, setQty } = useCart();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = (products.data ?? []).filter((p) => {
      if (categoryId && p.category_id !== categoryId) return false;
      if (!query) return true;
      return p.name.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query);
    });
    const sorted = [...list];
    if (sort === "price_low") sorted.sort((a, b) => a.effective_price - b.effective_price);
    else if (sort === "price_high") sorted.sort((a, b) => b.effective_price - a.effective_price);
    else if (sort === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    return sorted;
  }, [products.data, search, categoryId, sort]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <div className="flex items-center gap-2">
          <MenuButton />
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold text-ink">Products</p>
            <p className="text-xs text-ink-muted">Shop from 1000+ items</p>
          </div>
          <AccountAvatar />
        </div>

        <div className="flex items-center gap-2">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-border px-3.5">
            <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              type="search"
              placeholder="Search for products, brands and more…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 outline-none"
            />
          </div>
          <button
            type="button"
            aria-label="Filter"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-border text-ink-muted hover:bg-surface"
          >
            <FilterIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          <button
            type="button"
            onClick={() => setCategoryId(null)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                categoryId === null ? "bg-primary text-white" : "bg-primary-soft text-primary"
              }`}
            >
              <CategoryAllIcon className="h-5 w-5" />
            </div>
            <p className={`text-xs font-medium ${categoryId === null ? "text-primary" : "text-ink-muted"}`}>All</p>
          </button>
          {activeCategories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className="flex shrink-0 flex-col items-center gap-1.5"
            >
              <div
                className={`relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl text-sm font-semibold transition-colors ${
                  categoryId === c.id ? "bg-primary text-white" : "bg-primary-soft text-primary"
                }`}
              >
                {c.image ? (
                  <Image src={c.image} alt={c.name} fill sizes="48px" className="object-cover" />
                ) : (
                  c.name.charAt(0).toUpperCase()
                )}
              </div>
              <p className={`w-14 truncate text-center text-xs font-medium ${categoryId === c.id ? "text-primary" : "text-ink-muted"}`}>
                {c.name}
              </p>
            </button>
          ))}
        </div>
      </header>

      {products.isLoading && <SkeletonGrid />}

      {products.isError && (
        <div className="p-4 md:p-8">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load products. Pull down to refresh.
          </div>
        </div>
      )}

      {!products.isLoading && !products.isError && (
        <div className="flex items-center justify-between px-4 pt-3 text-sm text-ink-muted md:px-8">
          <span>{filtered.length} Products</span>
          <div className="w-40">
            <Select
              value={sort}
              onValueChange={(value) => setSort(value as SortOption)}
              options={[
                { value: "popular", label: "Sort by: Popular" },
                { value: "price_low", label: "Price: Low to High" },
                { value: "price_high", label: "Price: High to Low" },
                { value: "name", label: "Name" },
              ]}
            />
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
        <div className="grid grid-cols-2 gap-3 p-4 pb-6 md:grid-cols-4 md:p-8 lg:grid-cols-5">
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
