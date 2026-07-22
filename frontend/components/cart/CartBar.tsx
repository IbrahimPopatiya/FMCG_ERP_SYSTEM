"use client";

import { useRouter, usePathname } from "next/navigation";
import { useCart } from "@/components/cart/CartProvider";
import { formatCurrency } from "@/lib/utils/format";

// Floating summary bar shown across every customer screen once the cart has
// items — Blinkit-style persistent "go to cart" affordance. Hidden on the
// cart page itself, since it would just duplicate what's already on screen.
export function CartBar() {
  const router = useRouter();
  const pathname = usePathname();
  const { totalQty, subtotal } = useCart();

  if (totalQty === 0 || pathname.startsWith("/cart")) return null;

  return (
    <div className="shrink-0 border-t border-border bg-white px-4 py-2 sm:hidden">
      <button
        type="button"
        onClick={() => router.push("/cart")}
        className="flex w-full items-center justify-between gap-3 rounded-xl bg-primary px-4 py-3 text-white shadow-sm"
      >
        <span className="text-sm font-medium">
          {totalQty} item{totalQty === 1 ? "" : "s"} · {formatCurrency(subtotal)}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold">
          View cart
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </button>
    </div>
  );
}
