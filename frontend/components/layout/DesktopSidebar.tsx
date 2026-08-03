"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_BY_HREF } from "@/components/admin/icons";
import { Logo } from "@/components/ui/Logo";
import { BRAND } from "@/lib/branding";

interface NavItem {
  href: string;
  label: string;
}

export function DesktopSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col overflow-y-auto border-r border-border bg-white sm:flex">
      <div className="flex shrink-0 items-center gap-2 px-5 py-5 text-lg font-semibold tracking-tight text-ink">
        <Logo className="h-7 w-auto" />
        {!BRAND.logoIncludesName && BRAND.name}
      </div>
      <nav className="flex flex-col gap-1 px-3 pb-4">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = NAV_ICON_BY_HREF[item.href];
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                active ? "bg-primary-soft text-primary font-semibold" : "text-ink-muted hover:bg-surface hover:text-ink"
              }`}
            >
              {Icon && <Icon className="h-5 w-5" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
