"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchIcon, PlusIcon, CartIcon } from "@/components/salesman/icons";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { useCustomer } from "@/lib/hooks/useCustomer";
import { useProducts } from "@/lib/hooks/useProducts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useInventoryStockMap } from "@/lib/hooks/useInventoryStockMap";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useCart } from "@/components/salesman/CartContext";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductCatalogResponse } from "@/types/product";

export default function TakeOrderPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams.get("customerId") ?? "";

  const cart = useCart();
  const customer = useCustomer(customerId);
  const products = useProducts();
  const categories = useCategories();
  const stockMap = useInventoryStockMap();

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 250);
  const [categoryId, setCategoryId] = useState<string>("all");

  useEffect(() => {
    if (!customerId) {
      router.replace("/admin/salesman/customers?intent=take-order");
      return;
    }
    cart.setCustomer(customerId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const filteredProducts = useMemo(() => {
    let items = products.data ?? [];
    if (categoryId !== "all") items = items.filter((p) => p.category_id === categoryId);
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }
    return items;
  }, [products.data, categoryId, debouncedSearch]);

  if (!customerId) return null;

  return (
    <div className="pb-24">
      <SalesmanTopBar
        title={customer.data?.business_name ?? "Take Order"}
        subtitle="Take Order"
        back
        hideAlerts
      />

      <div className="flex flex-col gap-3 p-4 sm:p-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setCategoryId("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
              categoryId === "all" ? "bg-primary text-white" : "border border-border bg-white text-ink-muted"
            }`}
          >
            All
          </button>
          {categories.data?.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryId(cat.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium ${
                categoryId === cat.id ? "bg-primary text-white" : "border border-border bg-white text-ink-muted"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {products.isLoading &&
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-48 w-full rounded-xl" />)}

          {!products.isLoading && filteredProducts.length === 0 && (
            <p className="col-span-2 py-8 text-center text-sm text-ink-muted sm:col-span-3">No products found.</p>
          )}

          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} stock={stockMap.data?.get(product.id) ?? 0} />
          ))}
        </div>
      </div>

      {cart.itemCount > 0 && (
        <button
          type="button"
          onClick={() => router.push("/admin/salesman/cart")}
          className="fixed inset-x-4 bottom-4 z-20 flex items-center justify-between rounded-xl bg-primary px-4 py-3.5 text-white shadow-lg sm:inset-x-auto sm:right-6 sm:w-96"
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            <CartIcon className="h-5 w-5" />
            {cart.itemCount} item{cart.itemCount > 1 ? "s" : ""}
          </span>
          <span className="text-sm font-semibold">{formatCurrency(cart.subtotal)} · View Cart</span>
        </button>
      )}
    </div>
  );
}

function ProductCard({ product, stock }: { product: ProductCatalogResponse; stock: number }) {
  const cart = useCart();
  const line = cart.lines.find((l) => l.product.id === product.id);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-3 shadow-sm">
      <div className="flex h-20 items-center justify-center rounded-lg bg-surface">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full rounded-lg object-cover" />
        ) : (
          <span className="text-2xl">📦</span>
        )}
      </div>
      <p className="line-clamp-2 text-xs font-medium text-ink">{product.name}</p>
      <p className="text-[11px] text-ink-muted line-through">MRP {formatCurrency(product.mrp)}</p>
      <p className="text-sm font-semibold text-primary">{formatCurrency(product.effective_price)}</p>
      <p className={`text-[11px] font-medium ${stock > 0 ? "text-ink-muted" : "text-danger"}`}>
        {stock > 0 ? `${stock} in stock` : "Out of stock"}
      </p>

      {line ? (
        <QtyStepper
          size="sm"
          qty={line.qty}
          onChange={(qty) => {
            if (qty <= 0) cart.removeItem(product.id);
            else if (qty > line.qty) cart.incrementItem(product.id);
            else cart.decrementItem(product.id);
          }}
        />
      ) : (
        <button
          type="button"
          disabled={stock <= 0}
          onClick={() => cart.addItem(product)}
          className="flex items-center justify-center gap-1 rounded-lg bg-primary-soft py-2 text-xs font-semibold text-primary disabled:opacity-40"
        >
          <PlusIcon className="h-3.5 w-3.5" /> Add
        </button>
      )}
    </div>
  );
}
