"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CUSTOMER_MENU_ITEMS } from "@/components/customer/navItems";
import { MenuIcon, CloseIcon, LogoutIcon } from "@/components/customer/icons";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { clearSession } from "@/lib/auth/session";

// Mobile hamburger drawer for the customer storefront. Orders, Ledger, and
// Account live here instead of the bottom nav, which only shows Home,
// Products, and Cart per the redesign.
const CustomerMenuContext = createContext<{ open: () => void } | null>(null);

export function CustomerMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const customer = useCurrentCustomer();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    setIsOpen(false);
    router.push("/login");
  }

  return (
    <CustomerMenuContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      {isOpen && (
        <div className="fixed inset-0 z-40 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 max-w-[80%] flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-5 py-5">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-ink">
                  {customer.data?.business_name ?? "Your store"}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {customer.data ? `${customer.data.city}, ${customer.data.state}` : "Wholesale ordering"}
                </p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-1 flex-col gap-1 p-3">
              {CUSTOMER_MENU_ITEMS.map((item) => {
                const active = pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      active ? "bg-primary-soft text-primary" : "text-ink-muted hover:bg-surface hover:text-ink"
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <button
              type="button"
              onClick={handleLogout}
              className="m-3 flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 text-left text-sm font-medium text-ink-muted hover:bg-surface hover:text-ink"
            >
              <LogoutIcon className="h-5 w-5" />
              Log out
            </button>
          </div>
        </div>
      )}
    </CustomerMenuContext.Provider>
  );
}

export function MenuButton({ className = "" }: { className?: string }) {
  const ctx = useContext(CustomerMenuContext);
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => ctx?.open()}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface sm:hidden ${className}`}
    >
      <MenuIcon className="h-5 w-5" />
    </button>
  );
}
