"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { NAV_ICON_BY_HREF } from "@/components/admin/icons";
import { MenuIcon, AccountIcon } from "@/components/customer/icons";
import { SlideOutMenu } from "@/components/shared/SlideOutMenu";
import { Logo } from "@/components/ui/Logo";
import { BRAND } from "@/lib/branding";
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

  const menuItems = items.map((item) => ({ ...item, icon: NAV_ICON_BY_HREF[item.href] }));

  return (
    <AdminMenuContext.Provider value={{ open: () => setIsOpen(true) }}>
      {children}

      <SlideOutMenu
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        items={menuItems}
        panelClassName="w-[80%] max-w-xs"
        navClassName="px-4 py-4"
        footerClassName="px-4 py-4"
        activeItemClassName="bg-primary text-white shadow-sm"
        closeButtonClassName="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-ink-muted hover:bg-border"
        closeOnNavigate={false}
        header={
          <p className="flex min-w-0 items-center gap-2 truncate text-lg font-bold tracking-tight text-ink">
            <Logo className="h-7 w-auto" />
            {!BRAND.logoIncludesName && BRAND.name}
          </p>
        }
        footer={
          <Link
            href="/admin/profile"
            onClick={() => setIsOpen(false)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-bold text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <AccountIcon className="h-4 w-4" />
            Profile
          </Link>
        }
      />
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
