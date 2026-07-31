"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { AdminProductCard } from "@/components/products/AdminProductCard";
import { SearchIcon, PlusIcon } from "@/components/admin/icons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useProductsManage } from "@/lib/hooks/useProductsManage";
import { useSetProductStatus } from "@/lib/hooks/useProductMutations";
import { useCreatePost } from "@/lib/hooks/usePostMutations";
import type { ProductResponse } from "@/types/product";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

// Mirrors the backend's own leading-digit parse (app/services/post.py
// _extract_box_quantity) so a post's box quantity lines up with the
// product's packing string, e.g. "12 x 500ml" -> 12.
function extractBoxQuantity(packing: string): number {
  const match = packing.trim().match(/^\d+/);
  return match ? Number(match[0]) : 1;
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  if (hasSearch) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
        <p className="text-sm font-medium text-ink">No products match your search</p>
        <p className="text-sm text-ink-muted">Try a different name, SKU, or brand.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No products yet</h2>
      <p className="max-w-xs text-sm text-ink-muted">
        Add your first product to start building the catalog customers will order from.
      </p>
      <Link href="/admin/products/new">
        <Button type="button" className="mt-1">
          Add your first product
        </Button>
      </Link>
    </div>
  );
}

export default function AdminProductsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsManage(debouncedSearch);

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const setStatus = useSetProductStatus();
  const handleToggleStatus = (p: ProductResponse) =>
    setStatus.mutate({ productId: p.id, status: p.status === "active" ? "inactive" : "active" });

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const createPost = useCreatePost();

  function toggleSelected(p: ProductResponse) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(p.id)) next.delete(p.id);
      else next.add(p.id);
      return next;
    });
  }

  function exitSelectMode() {
    setSelectMode(false);
    setSelectedIds(new Set());
  }

  async function handleRepost() {
    const selectedProducts = products.filter((p) => selectedIds.has(p.id));
    if (selectedProducts.length === 0) return;

    await Promise.all(
      selectedProducts.map((p) =>
        createPost.mutateAsync({
          product_id: p.id,
          image: p.image,
          product_name: p.name,
          price: p.selling_price,
          mrp: p.mrp,
          quantity_in_box: extractBoxQuantity(p.packing),
        })
      )
    );
    exitSelectMode();
  }

  return (
    <div>
      <TopBar title="Products" subtitle="Manage All Products" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Products</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0
                ? `${total} product${total === 1 ? "" : "s"} in the catalog`
                : "Manage what customers can order"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectMode && (
              <button
                type="button"
                onClick={exitSelectMode}
                className="rounded-full px-3.5 py-2 text-sm font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
              >
                Cancel
              </button>
            )}
            <Button
              type="button"
              variant={selectMode ? "primary" : "secondary"}
              className="gap-1.5 rounded-full"
              isLoading={createPost.isPending}
              disabled={selectMode && selectedIds.size === 0}
              onClick={selectMode ? handleRepost : () => setSelectMode(true)}
            >
              {selectMode ? `Repost${selectedIds.size > 0 ? ` (${selectedIds.size})` : ""}` : "Post"}
            </Button>
            <Link href="/admin/products/new">
              <Button type="button" className="w-full gap-1.5 rounded-full sm:w-auto">
                <PlusIcon className="h-4 w-4" />
                Add Product
              </Button>
            </Link>
          </div>
        </div>
        <div className="relative max-w-sm">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>
      </header>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load products.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && total === 0 && <EmptyState hasSearch={!!debouncedSearch} />}

      {!isLoading && !isError && total > 0 && (
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-5">
            {products.map((p) => (
              <AdminProductCard
                key={p.id}
                product={p}
                onToggleStatus={handleToggleStatus}
                selectMode={selectMode}
                selected={selectedIds.has(p.id)}
                onToggleSelect={toggleSelected}
              />
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
