"use client";

import { createContext, useContext, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CUSTOMER_MENU_ITEMS } from "@/components/customer/navItems";
import { MenuIcon, LogoutIcon, StoreIcon } from "@/components/customer/icons";
import { SlideOutMenu } from "@/components/shared/SlideOutMenu";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { clearSession } from "@/lib/auth/session";

// Mobile hamburger drawer for the customer storefront. Orders, Ledger, and
// Account live here instead of the bottom nav, which only shows Home,
// Products, and Cart per the redesign.
const CustomerMenuContext = createContext<{ open: () => void } | null>(null);

export function CustomerMenuProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
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

      <SlideOutMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={CUSTOMER_MENU_ITEMS}
        header={
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
        }
        // footer={
        //   <button
        //     type="button"
        //     onClick={handleLogout}
        //     className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        //   >
        //     <LogoutIcon className="h-4 w-4" />
        //     Log out
        //   </button>
        // }
      />
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
