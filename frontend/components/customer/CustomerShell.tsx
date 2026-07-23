"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CUSTOMER_NAV_ITEMS } from "@/components/customer/navItems";
import { CartIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { clearSession } from "@/lib/auth/session";

// Persistent left sidebar shown at md+ widths, replacing the mobile bottom
// bar. Customers on desktop get the same 5 sections plus a "deliver to" +
// cart summary permanently visible, instead of hunting through a phone-style
// tab bar stretched across a wide screen.
export function CustomerDesktopSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { totalQty, subtotal } = useCart();
  const customer = useCurrentCustomer();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-white md:flex">
      <Link href="/account" className="flex items-center gap-2 border-b border-border px-5 py-5 hover:bg-surface">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
          {customer.data?.business_name.charAt(0).toUpperCase() ?? "S"}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-ink">
            {customer.data?.business_name ?? "Your store"}
          </p>
          <p className="truncate text-xs text-ink-muted">
            {customer.data ? `${customer.data.city}, ${customer.data.state}` : "Wholesale ordering"}
          </p>
        </div>
      </Link>

      <nav className="flex flex-1 flex-col gap-1 p-3">
        {CUSTOMER_NAV_ITEMS.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft text-primary" : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              <Icon className="h-5 w-5" />
              {item.label}
              {item.cartBadge && totalQty > 0 && (
                <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[11px] font-semibold text-white">
                  {totalQty > 9 ? "9+" : totalQty}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {totalQty > 0 && (
        <Link
          href="/cart"
          className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-lg bg-primary px-3.5 py-3 text-white"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <CartIcon className="h-4 w-4" />
            {totalQty} item{totalQty === 1 ? "" : "s"}
          </span>
          <span className="text-sm font-semibold">
            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(
              subtotal
            )}
          </span>
        </Link>
      )}

      <button
        type="button"
        onClick={handleLogout}
        className="mx-3 mb-4 rounded-lg border border-border px-3.5 py-2.5 text-left text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
      >
        Log out
      </button>
    </aside>
  );
}
