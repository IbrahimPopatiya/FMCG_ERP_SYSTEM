"use client";

import type { ComponentType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CloseIcon } from "@/components/customer/icons";

interface SlideOutMenuItem {
  href: string;
  label: string;
  icon?: ComponentType<{ className?: string }>;
}

export interface SlideOutMenuProps {
  isOpen: boolean;
  onClose: () => void;
  items: SlideOutMenuItem[];
  header: React.ReactNode;
  footer?: React.ReactNode;
  panelClassName?: string;
  navClassName?: string;
  footerClassName?: string;
  activeItemClassName?: string;
  inactiveItemClassName?: string;
  closeButtonClassName?: string;
  // Admin's drawer keeps its nav open after clicking a link — the salesman
  // and customer drawers close on navigate. Preserves that difference.
  closeOnNavigate?: boolean;
}

// Shared chrome (backdrop, sliding panel, nav list) for the admin, salesman,
// and customer mobile hamburger drawers — header/footer content and item
// source stay with each caller's own provider.
export function SlideOutMenu({
  isOpen,
  onClose,
  items,
  header,
  footer,
  panelClassName = "w-[88%] max-w-sm rounded-r-3xl",
  navClassName = "px-5 py-4",
  footerClassName = "px-5 py-4",
  activeItemClassName = "bg-primary-soft text-primary font-semibold",
  inactiveItemClassName = "text-ink hover:bg-surface",
  closeButtonClassName = "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary hover:brightness-95",
  closeOnNavigate = true,
}: SlideOutMenuProps) {
  const pathname = usePathname();

  return (
    <div className={`fixed inset-0 z-40 sm:hidden ${isOpen ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label="Close menu"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute inset-y-0 left-0 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${panelClassName} ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-5">
          {header}
          <button type="button" aria-label="Close menu" onClick={onClose} className={closeButtonClassName}>
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <nav className={`flex flex-1 flex-col gap-1 overflow-y-auto ${navClassName}`}>
          {items.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeOnNavigate ? onClose : undefined}
                className={`flex items-center gap-3 rounded-xl px-3 py-3 text-[15px] font-medium transition-colors ${
                  active ? activeItemClassName : inactiveItemClassName
                }`}
              >
                {Icon && <Icon className="h-[18px] w-[18px] shrink-0" />}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {footer && (
          <div
            className={`shrink-0 border-t border-border ${footerClassName}`}
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
