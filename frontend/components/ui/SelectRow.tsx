"use client";

import Image from "next/image";
import { NoProductImage } from "@/components/ui/NoProductImage";

// Checkbox row for bulk-selection settings screens (Product/Brand, Order,
// Customer/Salesman settings) — image is optional per row since customers
// and salesmen don't have one.
export function SelectRow({
  checked,
  onToggle,
  image,
  title,
  subtitle,
  trailing,
  disabled,
}: {
  checked: boolean;
  onToggle: () => void;
  image?: string | null;
  title: string;
  subtitle?: string;
  trailing?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      className={`flex items-center gap-3 rounded-xl border border-border bg-white px-3.5 py-3 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary-soft/40 ${
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer hover:bg-surface"
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        disabled={disabled}
        className="h-5 w-5 shrink-0 rounded border-border text-primary focus:ring-2 focus:ring-primary-soft disabled:cursor-not-allowed"
      />
      {image !== undefined && (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface">
          {image ? (
            <Image src={image} alt="" width={44} height={44} className="h-full w-full object-cover" />
          ) : (
            <NoProductImage className="[&>svg]:h-5 [&>svg]:w-5 [&>span]:hidden" />
          )}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{title}</p>
        {subtitle && <p className="truncate text-xs text-ink-muted">{subtitle}</p>}
      </div>
      {trailing}
    </label>
  );
}
