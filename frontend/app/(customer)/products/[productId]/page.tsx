"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCart } from "@/components/cart/CartProvider";
import { useProducts } from "@/lib/hooks/useProducts";
import { formatCurrency } from "@/lib/utils/format";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const router = useRouter();
  const products = useProducts();
  const { getQty, addItem, setQty } = useCart();

  const product = products.data?.find((p) => p.id === productId);
  const qty = getQty(productId);

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-white px-4 py-3">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface hover:text-ink"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <h1 className="text-base font-semibold text-ink">Product details</h1>
      </header>

      {products.isLoading && (
        <div className="flex flex-col gap-4 p-4">
          <Skeleton className="aspect-square w-full rounded-xl" />
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
      )}

      {!products.isLoading && !product && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">Product not found</p>
          <Link href="/products" className="text-sm font-medium text-primary hover:text-primary-hover">
            Back to products
          </Link>
        </div>
      )}

      {product && (
        <div className="flex flex-col gap-5 p-4 pb-6">
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-primary-soft">
            {product.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-primary/60">{product.unit}</span>
            )}
          </div>

          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">{product.name}</h2>
            <p className="mt-1 text-sm text-ink-muted">
              {product.packing} · {product.unit}
            </p>
            <p className="mt-0.5 font-mono text-xs text-ink-muted">{product.sku}</p>
          </div>

          <div className="flex items-end gap-3 rounded-xl border border-border bg-white p-4">
            <div>
              <p className="text-2xl font-semibold tracking-tight text-ink">
                {formatCurrency(product.effective_price)}
              </p>
              {product.mrp > product.effective_price && (
                <p className="text-sm text-ink-muted line-through">{formatCurrency(product.mrp)}</p>
              )}
            </div>
            <p className="mb-1 text-xs text-ink-muted">Incl. {product.gst_rate}% GST</p>
          </div>

          <div>
            {qty === 0 ? (
              <Button type="button" className="w-full" onClick={() => addItem(product, 1)}>
                Add to order
              </Button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                <QtyStepper qty={qty} onChange={(next) => setQty(product.id, next)} />
                <Link href="/cart" className="flex-1">
                  <Button type="button" className="w-full">
                    Go to cart
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
