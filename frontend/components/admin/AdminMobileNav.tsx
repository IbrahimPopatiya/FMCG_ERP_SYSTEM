"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_MOBILE_NAV_ITEMS } from "@/components/admin/navItems";
import { PlusIcon } from "@/components/admin/icons";

// Bottom nav with a raised center FAB, matching the salesman app's
// SalesmanMobileNav.tsx pattern — FAB jumps to the admin quick-actions
// sheet (New Purchase / Record Payment / Add Vehicle).
export function AdminMobileNav() {
  const pathname = usePathname();
  const [left, right] = [ADMIN_MOBILE_NAV_ITEMS.slice(0, 2), ADMIN_MOBILE_NAV_ITEMS.slice(2, 4)];

  return (
    <nav className="relative flex shrink-0 border-t border-border bg-white sm:hidden">
      {left.map((item) => (
        <AdminNavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
      ))}

      <Link
        href="/admin/quick-actions"
        aria-label="Quick actions"
        className="relative flex flex-1 items-center justify-center"
      >
        <span className="absolute -top-5 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-lg ring-4 ring-white transition-transform active:scale-95">
          <PlusIcon className="h-6 w-6" />
        </span>
      </Link>

      {right.map((item) => (
        <AdminNavLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
      ))}
    </nav>
  );
}

function AdminNavLink({
  item,
  active,
}: {
  item: (typeof ADMIN_MOBILE_NAV_ITEMS)[number];
  active: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
        active ? "text-primary" : "text-ink-muted/70"
      }`}
    >
      <Icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
