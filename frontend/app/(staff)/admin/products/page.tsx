"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useProductsManage } from "@/lib/hooks/useProductsManage";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductResponse } from "@/types/product";

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
  const categories = useCategories();
  const brands = useBrands();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const categoryName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? "—";
  const brandName = (id: string | null) => brands.data?.find((b) => b.id === id)?.name ?? "—";

  return (
    <div>
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
          <Link href="/admin/products/new">
            <Button type="button" className="w-full sm:w-auto">
              Add product
            </Button>
          </Link>
        </div>
        <input
          type="search"
          placeholder="Search by name, brand, or SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full max-w-sm rounded-lg border border-border px-3.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
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
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<ProductResponse>
                rowKey={(p) => p.id}
                rows={products}
                columns={[
                  {
                    header: "Product",
                    render: (p) => (
                      <Link href={`/admin/products/${p.id}`} className="font-medium text-ink hover:text-primary">
                        {p.name}
                        <div className="font-mono text-xs font-normal text-ink-muted">{p.sku}</div>
                      </Link>
                    ),
                  },
                  { header: "Category", render: (p) => categoryName(p.category_id) },
                  { header: "Brand", render: (p) => brandName(p.brand_id) },
                  { header: "Packing", render: (p) => `${p.unit} · ${p.packing}` },
                  { header: "MRP", render: (p) => formatCurrency(p.mrp) },
                  { header: "Selling price", render: (p) => formatCurrency(p.selling_price) },
                  { header: "GST", render: (p) => `${p.gst_rate}%` },
                  { header: "Status", render: (p) => <ProductStatusBadge status={p.status} /> },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {products.map((p) => (
              <Link key={p.id} href={`/admin/products/${p.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="font-mono text-xs text-ink-muted">{p.sku}</p>
                    <p className="mt-1 text-sm text-ink-muted">{formatCurrency(p.selling_price)}</p>
                  </div>
                  <ProductStatusBadge status={p.status} />
                </Card>
              </Link>
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
