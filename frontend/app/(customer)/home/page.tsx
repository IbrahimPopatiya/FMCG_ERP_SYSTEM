"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/components/cart/CartProvider";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { useCustomerDues } from "@/lib/hooks/useCustomerDues";
import { useOrders } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils/format";

export default function HomePage() {
  const router = useRouter();
  const customer = useCurrentCustomer();
  const products = useProducts();
  const categories = useCategories();
  const orders = useOrders();
  const dues = useCustomerDues();
  const { addItem } = useCart();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  const lastOrder = useMemo(() => {
    const sorted = [...(orders.data ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted[0] ?? null;
  }, [orders.data]);

  function reorderLastBasket() {
    if (!lastOrder) return;
    const productById = new Map((products.data ?? []).map((p) => [p.id, p]));
    for (const item of lastOrder.items) {
      const product = productById.get(item.product_id);
      if (product) addItem(product, item.ordered_qty);
    }
    router.push("/cart");
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex flex-col gap-1 border-b border-border bg-white px-4 py-4">
        <p className="text-sm text-ink-muted">Welcome back</p>
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          {customer.data?.business_name ?? "Your store"}
        </h1>
      </header>

      <div className="flex flex-col gap-5 p-4 pb-6">
        <Link
          href="/products"
          className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3.5 py-3 text-sm text-ink-muted"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" />
          </svg>
          Search products…
        </Link>

        {dues.data && dues.data.total_due > 0 && (
          <Link
            href="/dues"
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-amber-900">Outstanding dues</p>
              <p className="text-xs text-amber-700">Tap to view your unpaid invoices</p>
            </div>
            <p className="text-base font-semibold text-amber-900">{formatCurrency(dues.data.total_due)}</p>
          </Link>
        )}

        {lastOrder && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">Reorder your last basket</p>
              <p className="mt-0.5 text-xs text-ink-muted">
                {lastOrder.items.length} item{lastOrder.items.length === 1 ? "" : "s"} · {formatCurrency(lastOrder.total)}
              </p>
            </div>
            <Button type="button" variant="secondary" className="h-9 shrink-0 px-3 text-xs" onClick={reorderLastBasket}>
              Reorder
            </Button>
          </div>
        )}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">Shop by category</h2>
            <Link href="/products" className="text-xs font-medium text-primary hover:text-primary-hover">
              See all
            </Link>
          </div>

          {categories.isLoading && (
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          )}

          {!categories.isLoading && activeCategories.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {activeCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-3 text-center shadow-sm"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium text-ink">{c.name}</p>
                </Link>
              ))}
            </div>
          )}
        </div>

        <Link href="/products">
          <Button type="button" className="w-full">
            Browse all products
          </Button>
        </Link>
      </div>
    </div>
  );
}
