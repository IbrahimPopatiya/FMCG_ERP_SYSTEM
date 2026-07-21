"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
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
            className={`flex flex-1 flex-col items-center py-2 text-xs font-medium ${
              active ? "text-ink" : "text-ink-muted/60"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
