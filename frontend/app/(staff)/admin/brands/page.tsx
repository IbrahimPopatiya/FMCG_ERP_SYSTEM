"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { BrandForm } from "@/components/brands/BrandForm";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCreateBrand, useDeleteBrand } from "@/lib/hooks/useBrandMutations";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">No brands yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add the brands your products belong to, so products can be organized by brand.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add brand
      </Button>
    </div>
  );
}

export default function BrandsPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const brands = useBrands();
  const createBrand = useCreateBrand();
  const deleteBrand = useDeleteBrand();

  const rows = brands.data ?? [];

  return (
    <div>
      <TopBar title="Brands" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Brands</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} brand${rows.length === 1 ? "" : "s"}` : "Product brands"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add brand
        </Button>
      </header>

      {brands.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {brands.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load brands.
            <Button type="button" variant="secondary" onClick={() => brands.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!brands.isLoading && !brands.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!brands.isLoading && !brands.isError && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {rows.map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-3">
              <p className="truncate font-medium text-ink">{b.name}</p>
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                isLoading={deleteBrand.isPending && deleteBrand.variables === b.id}
                onClick={() => deleteBrand.mutate(b.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add brand">
        <BrandForm onSubmit={(payload) => createBrand.mutateAsync(payload)} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
