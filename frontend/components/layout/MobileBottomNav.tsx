"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_ICON_BY_HREF } from "@/components/admin/icons";

interface NavItem {
  href: string;
  label: string;
  badge?: number;
  icon?: (props: { className?: string }) => React.ReactElement;
}

export function MobileBottomNav({
  items,
  className = "bg-white border-border text-ink-muted",
  variant = "bar",
}: {
  items: NavItem[];
  className?: string;
  variant?: "bar" | "island";
}) {
  const pathname = usePathname();
  const isIsland = variant === "island";

  const links = items.map((item) => {
    const active = pathname.startsWith(item.href);
    const Icon = item.icon ?? NAV_ICON_BY_HREF[item.href];
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`relative flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
          isIsland ? "rounded-full" : ""
        } ${active ? "text-primary" : "text-ink-muted"}`}
      >
        {!!item.badge && (
          <span className="absolute right-[calc(50%-1.4rem)] top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-white">
            {item.badge > 9 ? "9+" : item.badge}
          </span>
        )}
        {Icon && <Icon className="h-5 w-5" />}
        {item.label}
      </Link>
    );
  });

  if (isIsland) {
    return (
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 px-4 pt-2 sm:hidden"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <nav
          className={`pointer-events-auto flex gap-1 rounded-full border shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl ${className}`}
        >
          {links}
        </nav>
      </div>
    );
  }

  return (
    <nav
      className={`flex shrink-0 border-t sm:hidden ${className}`}
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {links}
    </nav>
  );
}
