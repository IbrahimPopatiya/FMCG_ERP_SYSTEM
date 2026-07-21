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
    <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-white sm:flex">
      <div className="shrink-0 px-4 py-4 text-sm font-semibold text-ink">DMS</div>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-primary text-white" : "text-ink-muted hover:bg-surface"
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
