"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_BY_HREF } from "@/components/admin/icons";
import { MenuIcon, CloseIcon, AccountIcon } from "@/components/customer/icons";
import type { NavItem } from "@/lib/nav/roleNav";

// Mobile slide-out drawer for the admin/staff area — the bottom bar only
// carries a handful of tabs (see roleNav.ts), so roles with a longer nav
// list (manager, dispatcher, ...) reach the rest of their screens here,
// same pattern as the customer storefront's hamburger menu.
const AdminMenuContext = createContext<{ open: () => void } | null>(null);

export function AdminMenuProvider({
  items,
  children,
}: {
  items: NavItem[];
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <AdminMenuContext.Provider value={{ open: () => setIsOpen(true) }}>
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
          className={`absolute inset-y-0 left-0 flex w-[80%] max-w-xs flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ paddingTop: "env(safe-area-inset-top)" }}
        >
          <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-5">
            <p className="truncate text-lg font-bold tracking-tight text-ink">Zaid Traders</p>
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setIsOpen(false)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-muted hover:bg-border"
            >
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              const Icon = NAV_ICON_BY_HREF[item.href];
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
                    active ? "bg-primary text-white shadow-sm" : "text-ink hover:bg-surface"
                  }`}
                >
                  {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div
            className="shrink-0 border-t border-border px-4 py-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            <Link
              href="/admin/profile"
              onClick={() => setIsOpen(false)}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-ink-muted transition-colors hover:bg-surface hover:text-ink"
            >
              <AccountIcon className="h-4 w-4" />
              Profile
            </Link>
          </div>
        </div>
      </div>
    </AdminMenuContext.Provider>
  );
}

export function AdminMenuButton({ className = "" }: { className?: string }) {
  const ctx = useContext(AdminMenuContext);
  return (
    <button
      type="button"
      aria-label="Open menu"
      onClick={() => ctx?.open()}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink transition-colors hover:bg-surface sm:hidden ${className}`}
    >
      <MenuIcon className="h-5 w-5" />
    </button>
  );
}
