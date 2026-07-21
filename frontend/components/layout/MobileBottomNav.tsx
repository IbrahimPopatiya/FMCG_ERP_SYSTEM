"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  badge?: number;
}

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 border-t border-border bg-white sm:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center py-2 text-xs font-medium ${
              active ? "text-ink" : "text-ink-muted/60"
            }`}
          >
            {!!item.badge && (
              <span className="absolute right-[calc(50%-1.35rem)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
