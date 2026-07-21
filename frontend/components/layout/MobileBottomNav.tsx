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
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex border-t border-zinc-200 bg-white sm:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center py-2 text-xs font-medium ${
              active ? "text-zinc-900" : "text-zinc-400"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
