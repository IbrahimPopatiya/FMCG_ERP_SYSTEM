"use client";

import { useState } from "react";
import Image from "next/image";
import { TopBar } from "@/components/layout/TopBar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { NoProductImage } from "@/components/ui/NoProductImage";
import { SearchIcon, TrashIcon } from "@/components/admin/icons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useBrands } from "@/lib/hooks/useBrands";
import { useBulkDeleteBrands } from "@/lib/hooks/useBrandMutations";
import { useProductsManage } from "@/lib/hooks/useProductsManage";
import { useBulkDeleteProducts } from "@/lib/hooks/useProductMutations";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

type Tab = "brands" | "products";

function SelectRow({
  checked,
  onToggle,
  image,
  title,
  subtitle,
}: {
  checked: boolean;
  onToggle: () => void;
  image?: string | null;
  title: string;
  subtitle?: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-3 transition-colors hover:bg-surface has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary-soft"
      />
      {image !== undefined && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
          {image ? (
            <Image src={image} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <NoProductImage className="[&>svg]:h-5 [&>svg]:w-5 [&>span]:hidden" />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
      </div>
    </label>
  );
}

function SelectionBar({
  count,
  onClear,
  onDelete,
  isDeleting,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-21 z-30 mx-4 flex items-center justify-between gap-3 rounded-2xl border border-border bg-white px-4 py-3 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:sticky sm:bottom-0 sm:mx-0 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:px-6 sm:shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-ink">{count} selected</span>
        <button type="button" onClick={onClear} className="text-sm font-medium text-primary hover:underline">
          Clear
        </button>
      </div>
      <Button type="button" variant="danger" className="gap-1.5" onClick={onDelete} isLoading={isDeleting}>
        <TrashIcon className="h-4 w-4" />
        Delete
      </Button>
    </div>
  );
}

function BrandsPanel() {
  const brands = useBrands();
  const bulkDelete = useBulkDeleteBrands();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  const filtered = (brands.data ?? []).filter((b) =>
    b.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((b) => b.id)));
  }

  async function handleDelete() {
    await bulkDelete.mutateAsync(Array.from(selected));
    setSelected(new Set());
    setConfirmOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            {selected.size === filtered.length ? "Deselect all" : `Select all (${filtered.length})`}
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-3 sm:px-6">
        {brands.isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {!brands.isLoading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No brands found.</p>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((brand) => (
            <SelectRow
              key={brand.id}
              checked={selected.has(brand.id)}
              onToggle={() => toggle(brand.id)}
              image={brand.logo}
              title={brand.name}
            />
          ))}
        </div>
      </div>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirmOpen(true)}
        isDeleting={bulkDelete.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} brand${selected.size === 1 ? "" : "s"}?`}
        message="This also deletes every product under the selected brand(s) from the catalog. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={bulkDelete.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function ProductsPanel() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProductsManage(debouncedSearch, null);
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  const products = Array.from(new Map(allItems.map((p) => [p.id, p])).values());

  const bulkDelete = useBulkDeleteProducts();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === products.length) setSelected(new Set());
    else setSelected(new Set(products.map((p) => p.id)));
  }

  async function handleDelete() {
    await bulkDelete.mutateAsync(Array.from(selected));
    setSelected(new Set());
    setConfirmOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>
        {products.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            {selected.size === products.length ? "Deselect all" : `Select all on this page (${products.length})`}
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-3 sm:px-6">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && products.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No products found.</p>
        )}

        <div className="flex flex-col gap-2">
          {products.map((product) => (
            <SelectRow
              key={product.id}
              checked={selected.has(product.id)}
              onToggle={() => toggle(product.id)}
              image={product.image}
              title={product.name}
              subtitle={product.sku}
            />
          ))}
        </div>

        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && <p className="text-xs text-ink-muted">Loading more…</p>}
        </div>
      </div>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirmOpen(true)}
        isDeleting={bulkDelete.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} product${selected.size === 1 ? "" : "s"}?`}
        message="These products will be removed from the catalog immediately. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={bulkDelete.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function ProductSettingsPage() {
  useRoleGuard(["admin", "salesman", "manager"]);
  const [tab, setTab] = useState<Tab>("brands");

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Product Settings" backHref="/admin/products" />

      <div className="border-b border-border bg-white px-4 pb-4 pt-4 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Product Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Bulk delete brands or products</p>

        <div className="mt-4 flex gap-1 rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab("brands")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "brands" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Brands
          </button>
          <button
            type="button"
            onClick={() => setTab("products")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "products" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Products
          </button>
        </div>
      </div>

      {tab === "brands" ? <BrandsPanel /> : <ProductsPanel />}
    </div>
  );
}
