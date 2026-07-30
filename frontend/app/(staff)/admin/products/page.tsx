"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { SearchIcon, PlusIcon, PencilIcon, TrashIcon } from "@/components/admin/icons";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useProductsManage } from "@/lib/hooks/useProductsManage";
import { useSetProductStatus } from "@/lib/hooks/useProductMutations";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductResponse } from "@/types/product";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

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
  const categories = useCategories();
  const brands = useBrands();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const products = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const categoryName = (id: string | null) =>
    categories.data?.find((c) => c.id === id)?.name ?? "—";
  const brandName = (id: string | null) => brands.data?.find((b) => b.id === id)?.name ?? "—";
  const setStatus = useSetProductStatus();

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
          <Link href="/admin/products/new">
            <Button type="button" className="w-full gap-1.5 rounded-full sm:w-auto">
              <PlusIcon className="h-4 w-4" />
              Add Product
            </Button>
          </Link>
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
                      <Link
                        href={`/admin/products/${p.id}`}
                        className="flex items-center gap-3 font-medium text-ink hover:text-primary"
                      >
                        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
                          {p.image ? (
                            <Image src={p.image} alt={p.name} fill sizes="40px" className="object-cover" />
                          ) : (
                            <span className="text-xs font-medium text-ink-muted">{p.unit.slice(0, 2)}</span>
                          )}
                        </div>
                        <div>
                          {p.name}
                          <div className="font-mono text-xs font-normal text-ink-muted">{p.sku}</div>
                        </div>
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

          {/* Mobile: card list matching the mockup's product-row layout */}
          <div className="flex flex-col gap-3 sm:hidden">
            {products.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 rounded-2xl">
                <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-surface">
                    {p.image ? (
                      <Image src={p.image} alt={p.name} fill sizes="48px" className="object-cover" />
                    ) : (
                      <span className="text-xs font-medium text-ink-muted">{p.unit.slice(0, 2)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="mt-0.5 flex items-baseline gap-2 text-sm">
                      <span className="font-bold text-primary">{formatCurrency(p.selling_price)}</span>
                      {p.mrp > p.selling_price && (
                        <span className="text-xs text-ink-muted line-through">{formatCurrency(p.mrp)}</span>
                      )}
                    </p>
                    <p className="text-xs text-ink-muted">
                      {p.unit} · {p.packing}
                    </p>
                  </div>
                </Link>
                <div className="flex shrink-0 flex-col items-center gap-2">
                  <Link
                    href={`/admin/products/${p.id}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink-muted transition-colors hover:bg-surface"
                    aria-label="Edit product"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </Link>
                  <button
                    type="button"
                    onClick={() =>
                      setStatus.mutate({ productId: p.id, status: p.status === "active" ? "inactive" : "active" })
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-danger-soft text-danger transition-colors hover:bg-danger hover:text-white"
                    aria-label={p.status === "active" ? "Deactivate product" : "Activate product"}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </Card>
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
