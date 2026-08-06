"use client";

import { Suspense, useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { FilterDrawer } from "@/components/customer/FilterDrawer";
import { SearchIcon, SettingsIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useProductsFeed } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import type { ProductCatalogResponse } from "@/types/product";

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

export interface ProductsListPageProps {
  headerSlot: React.ReactNode;
  disabled?: boolean;
  renderCard: (product: ProductCatalogResponse, qty: number, onQtyChange: (product: ProductCatalogResponse, qty: number) => void) => React.ReactNode;
}

export function ProductsListPage(props: ProductsListPageProps) {
  return (
    <Suspense fallback={<SkeletonGrid />}>
      <ProductsListPageContent {...props} />
    </Suspense>
  );
}

function ProductsListPageContent({ headerSlot, disabled, renderCard }: ProductsListPageProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const categoryId = searchParams.get("category");
  const [sort, setSort] = useState<SortOption>("popular");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const { getQty, addItem, setQty } = useCart();
  const categories = useCategories();

  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } = useProductsFeed({
    search: debouncedSearch,
    categoryId,
    sort,
  });

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  // Depends only on the cart functions, not on the loaded product list -
  // stays the same reference across search/sort/category changes, so
  // memoized product cards can skip re-rendering while the user is just
  // typing/filtering.
  const handleQtyChange = useCallback(
    (product: ProductCatalogResponse, qty: number) => {
      if (disabled) return;
      if (qty === 0) setQty(product.id, 0);
      else if (getQty(product.id) === 0) addItem(product, qty);
      else setQty(product.id, qty);
    },
    [setQty, getQty, addItem, disabled]
  );

  function handleApplyFilter(nextCategoryId: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextCategoryId) params.set("category", nextCategoryId);
    else params.delete("category");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    setIsFilterOpen(false);
  }

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        {headerSlot}

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
            aria-label="Filters"
            onClick={() => setIsFilterOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors hover:brightness-95"
          >
            <SettingsIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </header>

      <FilterDrawer
        open={isFilterOpen}
        categories={categories.data ?? []}
        selectedCategoryId={categoryId}
        onApply={handleApplyFilter}
        onClose={() => setIsFilterOpen(false)}
      />

      {isLoading && <SkeletonGrid />}

      {isError && (
        <div className="p-4 md:p-8">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load products. Pull down to refresh.
          </div>
        </div>
      )}

      {!isLoading && !isError && (
        <div className="flex items-center justify-between px-4 pt-3 text-sm text-ink-muted md:px-8">
          <span>{total} Products</span>
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

      {!isLoading && !isError && products.length === 0 && !hasNextPage && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No products found</p>
          <p className="text-sm text-ink-muted">Try a different search or category.</p>
        </div>
      )}

      {!isLoading && !isError && (products.length > 0 || hasNextPage) && (
        <div className="p-4 pb-6 md:p-8">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((product) => renderCard(product, getQty(product.id), handleQtyChange))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
