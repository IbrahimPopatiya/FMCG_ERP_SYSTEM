"use client";

import Image from "next/image";
import Link from "next/link";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCategories } from "@/lib/hooks/useCategories";

export default function CategoriesPage() {
  const categories = useCategories();
  const items = categories.data ?? [];

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-4 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Categories</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Browse everything by category</p>
      </header>

      <div className="p-4 pb-28 md:p-8">
        {categories.isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        )}

        {categories.isError && (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-ink-muted">Couldn&apos;t load categories.</p>
            <button
              type="button"
              onClick={() => categories.refetch()}
              className="text-sm font-medium text-primary hover:text-primary-hover"
            >
              Try again
            </button>
          </div>
        )}

        {!categories.isLoading && !categories.isError && items.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">No categories available yet.</p>
        )}

        {!categories.isLoading && !categories.isError && items.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
            {items.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.id}`}
                className="flex flex-col items-center gap-3 rounded-xl border border-border bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-lg font-semibold text-primary">
                  {c.image ? (
                    <Image src={c.image} alt={c.name} fill sizes="64px" className="object-cover" />
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
