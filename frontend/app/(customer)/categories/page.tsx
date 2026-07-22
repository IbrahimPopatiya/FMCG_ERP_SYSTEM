"use client";

import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCategories } from "@/lib/hooks/useCategories";
import { useProducts } from "@/lib/hooks/useProducts";
import { useMemo } from "react";

export default function CategoriesPage() {
  const categories = useCategories();
  const products = useProducts();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-4 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Categories</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Browse everything by category</p>
      </header>

      <div className="p-4 pb-6 md:p-8">
        {categories.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        )}

        {!categories.isLoading && activeCategories.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">No categories available yet.</p>
        )}

        {!categories.isLoading && activeCategories.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {activeCategories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-lg font-semibold text-primary">
                  {c.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                  ) : (
                    c.name.charAt(0).toUpperCase()
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-medium text-ink">{c.name}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
