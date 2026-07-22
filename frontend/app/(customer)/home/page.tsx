"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { DiscountBadge } from "@/components/customer/DiscountBadge";
import { SearchIcon, BellIcon, CartIcon, TruckIcon, ShieldIcon, BoxIcon } from "@/components/customer/icons";
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
  const { addItem, getQty, setQty, totalQty } = useCart();

  const activeCategories = useMemo(() => {
    const usedIds = new Set((products.data ?? []).map((p) => p.category_id).filter(Boolean));
    return (categories.data ?? []).filter((c) => usedIds.has(c.id));
  }, [products.data, categories.data]);

  const deals = useMemo(
    () => (products.data ?? []).filter((p) => p.mrp > p.effective_price).slice(0, 8),
    [products.data]
  );

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
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3 md:px-8">
        <div className="min-w-0">
          <p className="text-xs text-ink-muted">Deliver to</p>
          <p className="truncate text-sm font-semibold text-ink">
            {customer.data?.business_name ?? "Your store"}
          </p>
          {customer.data && (
            <p className="truncate text-xs text-ink-muted">
              {customer.data.city}, {customer.data.state}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3 text-ink-muted">
          <Link href="/products" aria-label="Search" className="hover:text-ink">
            <SearchIcon className="h-5 w-5" />
          </Link>
          <span aria-hidden className="hidden hover:text-ink sm:inline-flex">
            <BellIcon className="h-5 w-5" />
          </span>
          <Link href="/cart" aria-label="Cart" className="relative hover:text-ink md:hidden">
            <CartIcon className="h-5 w-5" />
            {totalQty > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {totalQty > 9 ? "9+" : totalQty}
              </span>
            )}
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 pb-6 md:p-8">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="flex flex-col gap-6 md:col-span-2">
            <div className="flex flex-col justify-between gap-4 rounded-2xl bg-primary-soft p-6 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold leading-tight text-ink">
                  Wholesale Prices
                  <br />
                  Best Quality FMCG
                </h1>
                <p className="mt-1 text-sm text-ink-muted">For your business</p>
                <Link href="/products">
                  <Button type="button" className="mt-4 gap-1.5">
                    Shop Now
                    <span aria-hidden>→</span>
                  </Button>
                </Link>
              </div>
            </div>

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

            {lastOrder && (
              <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 shadow-sm">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-ink">Reorder your last basket</p>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {lastOrder.items.length} item{lastOrder.items.length === 1 ? "" : "s"} ·{" "}
                    {formatCurrency(lastOrder.total)}
                  </p>
                </div>
                <Button type="button" variant="secondary" className="h-9 shrink-0 px-3 text-xs" onClick={reorderLastBasket}>
                  Reorder
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-white p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <TruckIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Free Delivery</p>
                <p className="text-xs text-ink-muted">On orders above ₹1,500</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
                <ShieldIcon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">Credit Available</p>
                <p className="text-xs text-ink-muted">
                  {customer.data ? `Limit up to ${formatCurrency(customer.data.credit_limit)}` : "Pay later for trusted users"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Shop by Category</h2>
            <Link href="/categories" className="text-sm font-medium text-primary hover:text-primary-hover">
              View All
            </Link>
          </div>

          {categories.isLoading && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square w-full rounded-xl" />
              ))}
            </div>
          )}

          {!categories.isLoading && activeCategories.length > 0 && (
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
              {activeCategories.slice(0, 5).map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.id}`}
                  className="flex flex-col items-center gap-2 rounded-xl border border-border bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-primary-soft text-sm font-semibold text-primary">
                    {c.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.image} alt={c.name} className="h-full w-full object-cover" />
                    ) : (
                      c.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs font-medium text-ink">{c.name}</p>
                </Link>
              ))}
              <Link
                href="/categories"
                className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-white p-3 text-center shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-muted">
                  <BoxIcon className="h-5 w-5" />
                </div>
                <p className="text-xs font-medium text-ink">View All</p>
              </Link>
            </div>
          )}
        </section>

        {deals.length > 0 && (
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-base font-semibold text-ink">Top Deals for You</h2>
              <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-hover">
                View All
              </Link>
            </div>
            <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-4 md:overflow-visible md:px-0">
              {deals.map((product) => {
                const qty = getQty(product.id);
                return (
                  <div
                    key={product.id}
                    className="w-36 shrink-0 rounded-xl border border-border bg-white p-3 shadow-sm md:w-auto"
                  >
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
                      <div>
                        <p className="text-sm font-semibold text-ink">{formatCurrency(product.effective_price)}</p>
                        <p className="text-xs text-ink-muted line-through">{formatCurrency(product.mrp)}</p>
                      </div>
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => addItem(product, 1)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-base font-semibold text-white hover:bg-primary-hover"
                          aria-label="Add"
                        >
                          +
                        </button>
                      ) : (
                        <QtyStepper qty={qty} onChange={(next) => setQty(product.id, next)} size="sm" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        <section className="flex items-center justify-between gap-4 rounded-xl border border-accent/30 bg-accent-soft p-4">
          <div className="flex items-center gap-3">
            <BoxIcon className="h-8 w-8 shrink-0 text-accent" />
            <div>
              <p className="text-sm font-semibold text-ink">Bulk Orders, Bigger Savings!</p>
              <p className="text-xs text-ink-muted">Get extra discounts on bulk orders</p>
            </div>
          </div>
          <Link href="/products">
            <Button type="button" variant="secondary" className="shrink-0 gap-1 whitespace-nowrap">
              Order Now →
            </Button>
          </Link>
        </section>
      </div>
    </div>
  );
}
