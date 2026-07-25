"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon?: (props: { className?: string }) => React.ReactElement;
}

export function DesktopSidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 flex-col overflow-y-auto border-r border-border bg-white sm:flex">
      <div className="shrink-0 px-4 py-4 text-sm font-semibold text-ink">DMS</div>
      <nav className="flex flex-col gap-0.5 px-2 pb-4">
        {items.map((item) => {
          const active = pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium ${
                active ? "bg-primary text-white" : "text-ink-muted hover:bg-surface"
              }`}
            >
              {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
