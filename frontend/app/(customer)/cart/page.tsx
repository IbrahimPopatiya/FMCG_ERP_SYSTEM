"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { FreeDeliveryProgress } from "@/components/customer/FreeDeliveryProgress";
import { useCart } from "@/components/cart/CartProvider";
import { useCreateOrder } from "@/lib/hooks/useOrderMutations";
import { formatCurrency } from "@/lib/utils/format";

function placeOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "No active warehouse can fulfil this order right now. Please try again later.";
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return "One of the items in your cart is no longer available. Please review your cart.";
  }
  return "Couldn't place your order. Please check your connection and try again.";
}

export default function CartPage() {
  const router = useRouter();
  const { items, subtotal, setQty, removeItem, clear } = useCart();
  const createOrder = useCreateOrder();
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const estimatedTax = items.reduce((sum, i) => sum + (i.price * i.qty * i.gstRate) / 100, 0);
  const removalItem = items.find((i) => i.productId === pendingRemoval);

  async function handlePlaceOrder() {
    setError(null);
    try {
      const order = await createOrder.mutateAsync({
        items: items.map((i) => ({ product_id: i.productId, ordered_qty: i.qty })),
      });
      clear();
      router.push(`/orders/${order.id}`);
    } catch (err) {
      setError(placeOrderErrorMessage(err));
    }
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">
          Your Cart {items.length > 0 && `(${items.length})`}
        </h1>
      </header>

      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-20 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M6 6h15l-1.5 9h-12z M6 6L5 3H2 M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-ink">Your cart is empty</h2>
          <p className="max-w-xs text-sm text-ink-muted">
            Browse the catalog and add items to place an order.
          </p>
          <Link href="/products">
            <Button type="button" className="mt-1">
              Browse products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 pb-6 md:p-8">
          <FreeDeliveryProgress subtotal={subtotal} />

          <div className="flex flex-col divide-y divide-border rounded-xl border border-border bg-white">
            {items.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.image} alt={item.name} className="h-full w-full rounded-lg object-cover" />
                  ) : (
                    <span className="text-[10px] font-medium text-primary/60">{item.unit}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                  <p className="text-xs text-ink-muted">{item.packing}</p>
                  <p className="mt-0.5 text-sm font-semibold text-ink">{formatCurrency(item.price)}</p>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <QtyStepper qty={item.qty} onChange={(qty) => setQty(item.productId, qty)} size="sm" />
                  <button
                    type="button"
                    onClick={() => setPendingRemoval(item.productId)}
                    className="text-xs font-medium text-danger hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Estimated GST</span>
              <span>{formatCurrency(estimatedTax)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(subtotal + estimatedTax)}</span>
            </div>
            <p className="text-xs text-ink-muted">Final total is confirmed by the distributor on approval.</p>
          </div>

          {error && (
            <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">{error}</div>
          )}

          <Button
            type="button"
            className="w-full"
            isLoading={createOrder.isPending}
            onClick={handlePlaceOrder}
          >
            Place order
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove item"
        message={removalItem ? `Remove ${removalItem.name} from your cart?` : ""}
        confirmLabel="Remove"
        tone="danger"
        onConfirm={() => {
          if (pendingRemoval) removeItem(pendingRemoval);
          setPendingRemoval(null);
        }}
        onCancel={() => setPendingRemoval(null)}
      />
    </div>
  );
}
