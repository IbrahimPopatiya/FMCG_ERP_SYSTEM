"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  badge?: number;
  icon?: (props: { className?: string }) => React.ReactElement;
}

export function MobileBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="flex shrink-0 border-t border-border bg-white sm:hidden">
      {items.map((item) => {
        const active = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${
              active ? "text-primary" : "text-ink-muted/70"
            }`}
          >
            {!!item.badge && (
              <span className="absolute right-[calc(50%-1.4rem)] top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
                {item.badge > 9 ? "9+" : item.badge}
              </span>
            )}
            {Icon && <Icon className="h-5 w-5" />}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
