"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { TrashIcon, CartIcon, StoreIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useSalesmanCustomers } from "@/lib/hooks/useSalesmanCustomers";
import { useSelectedCustomer } from "@/components/salesman/SelectedCustomerProvider";
import { useCreateOrder } from "@/lib/hooks/useOrderMutations";
import { formatCurrency } from "@/lib/utils/format";

function placeOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 403) {
    return "You may only place orders for customers on your own route.";
  }
  if (isAxiosError(error) && error.response?.status === 409) {
    return "No active warehouse can fulfil this order right now. Please try again later.";
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return "One of the items in your cart or the selected customer is no longer available.";
  }
  return "Couldn't place the order. Please check your connection and try again.";
}

export default function SalesmanCartPage() {
  const router = useRouter();
  const { items, subtotal, setQty, removeItem, clear } = useCart();
  const { data: customersPage } = useSalesmanCustomers();
  const { customerId, setCustomerId } = useSelectedCustomer();
  const createOrder = useCreateOrder();
  const [pendingRemoval, setPendingRemoval] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const customer = customersPage?.items.find((c) => c.id === customerId);
  const removalItem = items.find((i) => i.productId === pendingRemoval);

  async function handlePlaceOrder() {
    if (!customerId) {
      setError("Select a customer before placing the order.");
      return;
    }
    setError(null);
    try {
      const order = await createOrder.mutateAsync({
        customer_id: customerId,
        items: items.map((i) => ({ product_id: i.productId, ordered_qty: i.qty * i.unitsPerBox })),
      });
      clear();
      setCustomerId(null);
      router.push(`/salesman/orders/${order.id}`);
    } catch (err) {
      setError(placeOrderErrorMessage(err));
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <CartIcon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-extrabold tracking-tight text-ink">Order Bag</p>
            <p className="text-xs text-ink-muted">
              {items.length} {items.length === 1 ? "Item" : "Items"}
            </p>
          </div>
        </div>

        {customer && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-primary-soft px-3 py-2 text-primary">
            <StoreIcon className="h-4 w-4 shrink-0" />
            <span className="truncate text-sm font-medium">Ordering for {customer.business_name}</span>
          </div>
        )}
      </header>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path
                d="M6 6h15l-1.5 9h-12z M6 6L5 3H2 M9 21a1 1 0 100-2 1 1 0 000 2zm9 0a1 1 0 100-2 1 1 0 000 2z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h2 className="text-base font-semibold text-ink">The bag is empty</h2>
          <p className="max-w-xs text-sm text-ink-muted">
            Browse the catalog and add items to build the customer&apos;s order.
          </p>
          <Link href="/salesman/products">
            <Button type="button" className="mt-1">
              Browse products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4 pb-28 md:p-8">
          {!customer && (
            <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
              No customer selected. Go back to Products to choose one before placing this order.
            </div>
          )}

          <div className="flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.productId} className="flex gap-3 rounded-xl border border-border bg-white p-3">
                <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary-soft">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      sizes="64px"
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-medium text-primary/60">{item.unit}</span>
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">{item.name}</p>
                      <p className="text-xs text-ink-muted">{item.unit}</p>
                    </div>
                    <button
                      type="button"
                      aria-label="Remove item"
                      onClick={() => setPendingRemoval(item.productId)}
                      className="shrink-0 text-ink-muted hover:text-danger"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-0.5 text-sm font-semibold text-ink">
                    {formatCurrency(item.price)}
                    <span className="ml-0.5 text-xs font-normal text-ink-muted">
                      /pc · {item.unitsPerBox} pcs/box
                    </span>
                  </p>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <QtyStepper qty={item.qty} onChange={(qty) => setQty(item.productId, qty)} size="sm" />
                    <span className="text-sm font-semibold text-ink">
                      {formatCurrency(item.price * item.unitsPerBox * item.qty)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2 rounded-xl border border-border bg-white p-4">
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <span>Subtotal ({items.length} {items.length === 1 ? "Item" : "Items"})</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="mt-1 flex items-center justify-between border-t border-border pt-2 text-base font-semibold text-ink">
              <span>Total Amount</span>
              <span className="text-primary">{formatCurrency(subtotal)}</span>
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
            disabled={!customerId}
            onClick={handlePlaceOrder}
          >
            Place order
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={pendingRemoval !== null}
        title="Remove item"
        message={removalItem ? `Remove ${removalItem.name} from the bag?` : ""}
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
