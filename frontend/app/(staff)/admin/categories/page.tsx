"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCreateCategory, useDeleteCategory } from "@/lib/hooks/useCategoryMutations";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">No categories yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add product categories so the catalog can be browsed and filtered by type.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add category
      </Button>
    </div>
  );
}

export default function CategoriesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const categories = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const rows = categories.data ?? [];
  const nameById = new Map(rows.map((c) => [c.id, c.name]));

  return (
    <div>
      <TopBar title="Categories" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Categories</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} categor${rows.length === 1 ? "y" : "ies"}` : "Product categories"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add category
        </Button>
      </header>

      {categories.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {categories.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load categories.
            <Button type="button" variant="secondary" onClick={() => categories.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!categories.isLoading && !categories.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!categories.isLoading && !categories.isError && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {rows.map((c) => (
            <Card key={c.id} className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{c.name}</p>
                {c.parent_id && (
                  <p className="truncate text-xs text-ink-muted">Under {nameById.get(c.parent_id) ?? "—"}</p>
                )}
              </div>
              <Button
                type="button"
                variant="secondary"
                className="h-9 px-3 text-xs"
                isLoading={deleteCategory.isPending && deleteCategory.variables === c.id}
                onClick={() => deleteCategory.mutate(c.id)}
              >
                Delete
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add category">
        <CategoryForm
          categories={rows}
          onSubmit={(payload) => createCategory.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
