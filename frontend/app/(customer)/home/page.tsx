"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { DiscountBadge } from "@/components/customer/DiscountBadge";
import { AccountAvatar } from "@/components/customer/AccountAvatar";
import { SearchIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { useCustomerDues } from "@/lib/hooks/useCustomerDues";
import { useOrders } from "@/lib/hooks/useOrders";
import { useProducts } from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductCatalogResponse } from "@/types/product";

const LATEST_COUNT = 8;

function ProductSliderCard({
  product,
  qty,
  onAdd,
  onQtyChange,
}: {
  product: ProductCatalogResponse;
  qty: number;
  onAdd: () => void;
  onQtyChange: (qty: number) => void;
}) {
  return (
    <div className="w-36 shrink-0 rounded-xl border border-border bg-white p-3 shadow-sm">
      <Link href={`/products/${product.id}`} className="relative block">
        <div className="mb-2 flex aspect-square items-center justify-center overflow-hidden rounded-lg bg-primary-soft">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-primary/60">{product.unit}</span>
          )}
        </div>
        <div className="absolute left-1.5 top-1.5">
          <DiscountBadge mrp={product.mrp} effectivePrice={product.effective_price} />
        </div>
      </Link>
      <p className="line-clamp-2 text-xs font-medium leading-snug text-ink">{product.name}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{product.packing}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold text-ink">{formatCurrency(product.effective_price)}</p>
        {qty === 0 ? (
          <button
            type="button"
            onClick={onAdd}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-hover"
            aria-label="Add"
          >
            +
          </button>
        ) : (
          <QtyStepper qty={qty} onChange={onQtyChange} size="sm" />
        )}
      </div>
    </div>
  );
}

function ProductSlider({
  title,
  products,
  emptyMessage,
  getQty,
  onAdd,
  onQtyChange,
}: {
  title: string;
  products: ProductCatalogResponse[];
  emptyMessage?: string;
  getQty: (productId: string) => number;
  onAdd: (product: ProductCatalogResponse) => void;
  onQtyChange: (productId: string, qty: number) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-ink">{title}</h2>
        <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-hover">
          View All
        </Link>
      </div>

      {products.length === 0 && emptyMessage && (
        <p className="py-6 text-center text-sm text-ink-muted">{emptyMessage}</p>
      )}

      {products.length > 0 && (
        <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
          {products.map((product) => (
            <ProductSliderCard
              key={product.id}
              product={product}
              qty={getQty(product.id)}
              onAdd={() => onAdd(product)}
              onQtyChange={(qty) => onQtyChange(product.id, qty)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const customer = useCurrentCustomer();
  const products = useProducts();
  const categories = useCategories();
  const orders = useOrders();
  const dues = useCustomerDues();
  const { addItem, getQty, setQty } = useCart();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  const latestProducts = useMemo(() => (products.data ?? []).slice(0, LATEST_COUNT), [products.data]);

  // "Recent buy" = products this customer has actually ordered before, most
  // recent order first, deduped — falls back to remaining products (past the
  // "latest" slice) so first-time customers still see a full slider.
  const recentBuyProducts = useMemo(() => {
    const productById = new Map((products.data ?? []).map((p) => [p.id, p]));
    const sortedOrders = [...(orders.data ?? [])].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    const seen = new Set<string>();
    const fromHistory: ProductCatalogResponse[] = [];
    for (const order of sortedOrders) {
      for (const item of order.items) {
        if (seen.has(item.product_id)) continue;
        const product = productById.get(item.product_id);
        if (product) {
          seen.add(item.product_id);
          fromHistory.push(product);
        }
      }
    }
    if (fromHistory.length > 0) return fromHistory;
    return (products.data ?? []).slice(LATEST_COUNT);
  }, [products.data, orders.data]);

  return (
    <div className="flex flex-col">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 pb-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1 rounded-xl border border-border bg-white px-4 py-3">
            <p className="text-xs text-ink-muted">Deliver to</p>
            <p className="truncate text-sm font-semibold text-ink">
              {customer.data?.business_name ?? "Your store"}
              {customer.data && (
                <span className="font-normal text-ink-muted"> · {customer.data.city}, {customer.data.state}</span>
              )}
            </p>
          </div>
          <AccountAvatar className="h-11 w-11" />
        </div>

        <Link
          href="/products"
          className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink-muted shadow-sm"
        >
          <SearchIcon className="h-5 w-5" />
          Search…
        </Link>

        <section>
          {categories.isLoading && (
            <div className="flex gap-3 overflow-x-hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-16 shrink-0 rounded-full" />
              ))}
            </div>
          )}
          {!categories.isLoading && activeCategories.length > 0 && (
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
              {activeCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="flex shrink-0 flex-col items-center gap-1.5"
                >
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border border-border bg-white text-lg font-semibold text-primary shadow-sm">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="w-16 truncate text-center text-xs font-medium text-ink">{c.name}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {dues.data && dues.data.total_due > 0 && (
          <Link
            href="/dues"
            className="flex items-center justify-between gap-3 rounded-xl border border-accent/30 bg-accent-soft px-4 py-3"
          >
            <div>
              <p className="text-sm font-medium text-ink">Outstanding dues</p>
              <p className="text-xs text-ink-muted">Tap to view your unpaid invoices</p>
            </div>
            <p className="text-base font-semibold text-ink">{formatCurrency(dues.data.total_due)}</p>
          </Link>
        )}

        {products.isLoading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-36 shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <ProductSlider
            title="Latest Products"
            products={latestProducts}
            getQty={getQty}
            onAdd={(product) => addItem(product, 1)}
            onQtyChange={setQty}
          />
        )}

        {products.isLoading ? (
          <div className="flex gap-3 overflow-x-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-36 shrink-0 rounded-xl" />
            ))}
          </div>
        ) : (
          <ProductSlider
            title="Recent Buy Products"
            products={recentBuyProducts}
            emptyMessage="Nothing to show here yet."
            getQty={getQty}
            onAdd={(product) => addItem(product, 1)}
            onQtyChange={setQty}
          />
        )}

        <Link href="/products">
          <Button type="button" className="w-full">
            Browse all products
          </Button>
        </Link>
      </div>
    </div>
  );
}
