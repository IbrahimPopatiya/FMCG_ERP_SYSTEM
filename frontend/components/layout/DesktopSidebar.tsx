"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
}

export function DesktopSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-zinc-200 bg-white sm:flex sm:flex-col">
      <div className="px-4 py-4 text-sm font-semibold text-zinc-900">DMS</div>
      <nav className="flex flex-col gap-0.5 px-2">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-zinc-900 text-white" : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
