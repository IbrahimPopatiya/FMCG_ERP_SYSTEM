"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CUSTOMER_MENU_ITEMS } from "@/components/customer/navItems";
import { MenuIcon, CloseIcon, LogoutIcon, StoreIcon } from "@/components/customer/icons";
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

      <div className={`fixed inset-0 z-40 sm:hidden ${isOpen ? "" : "pointer-events-none"}`}>
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setIsOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <div
          className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col rounded-r-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-5">
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <StoreIcon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-[15px] font-semibold text-ink">
                  {customer.data?.business_name ?? "Your store"}
                </p>
                <p className="truncate text-xs text-ink-muted">
                  {customer.data ? `${customer.data.city}, ${customer.data.state}` : "Wholesale ordering"}
                </p>
              </div>
            </div>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsOpen(false)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary hover:brightness-95"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-5 py-4">
            {CUSTOMER_MENU_ITEMS.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
                    active ? "bg-primary-soft text-primary font-semibold" : "text-ink hover:bg-surface"
                  }`}
                >
                  <Icon className="h-[18px] w-[18px] shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="shrink-0 border-t border-border px-5 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <LogoutIcon className="h-4 w-4" />
              Log out
            </button>
          </div>
        </div>
      </div>
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
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors hover:brightness-95 sm:hidden ${className}`}
    >
      <MenuIcon className="h-[18px] w-[18px]" />
    </button>
  );
}
