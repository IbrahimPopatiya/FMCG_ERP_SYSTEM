import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { PencilIcon, TrashIcon } from "@/components/admin/icons";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductResponse } from "@/types/product";

interface AdminProductCardProps {
  product: ProductResponse;
  onToggleStatus: (product: ProductResponse) => void;
  selectMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (product: ProductResponse) => void;
}

// Same card shape as the customer storefront's CustomerProductCard (square
// image, name, packing, price) so admin's catalog reads as the same product
// grid — just with Edit/Delete in place of Add to Cart. In select mode (for
// the Products screen's "Post" flow) the whole card becomes a checkbox
// toggle instead of a link to the edit page.
function AdminProductCardBase({
  product,
  onToggleStatus,
  selectMode = false,
  selected = false,
  onToggleSelect,
}: AdminProductCardProps) {
  const imageBlock = (
    <div className="relative block">
      <div className="relative flex aspect-square items-center justify-center bg-surface">
        {product.image ? (
          <Image
            src={product.image}
            alt={product.name}
            fill
            sizes="(min-width: 640px) 200px, 50vw"
            className="object-cover"
          />
        ) : (
          <span className="text-xs font-medium text-ink-muted">{product.unit}</span>
        )}
      </div>
      <div className="absolute left-2 top-2">
        <ProductStatusBadge status={product.status} />
      </div>
      {selectMode && (
        <div
          className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 transition-colors ${
            selected ? "border-primary bg-primary text-white" : "border-white bg-white/70 text-transparent"
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M5 12l5 5 9-9" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </div>
  );

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md ${
        selectMode && selected ? "border-primary ring-2 ring-primary-soft" : "border-border"
      }`}
    >
      {selectMode ? (
        <button type="button" onClick={() => onToggleSelect?.(product)} className="block text-left">
          {imageBlock}
        </button>
      ) : (
        <Link href={`/admin/products/${product.id}`}>{imageBlock}</Link>
      )}

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        {selectMode ? (
          <button type="button" onClick={() => onToggleSelect?.(product)} className="text-left">
            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
          </button>
        ) : (
          <Link href={`/admin/products/${product.id}`}>
            <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
          </Link>
        )}
        <p className="text-xs text-ink-muted">{product.packing}</p>
        <p className="text-sm">
          <span className="font-semibold text-ink">{formatCurrency(product.selling_price)}</span>
          {product.mrp > product.selling_price && (
            <span className="ml-1.5 text-xs text-ink-muted line-through">{formatCurrency(product.mrp)}</span>
          )}
        </p>
        {/* {!selectMode && (
          <div className="mt-auto flex gap-1.5 pt-1.5">
            <Link
              href={`/admin/products/${product.id}`}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f2f2f3] text-xs font-semibold text-[#1c1c1e] transition-colors hover:bg-[#1c1c1e] hover:text-white"
            >
              <PencilIcon className="h-3.5 w-3.5" />
              Edit
            </Link>
            <button
              type="button"
              onClick={() => onToggleStatus(product)}
              aria-label={product.status === "active" ? "Deactivate product" : "Activate product"}
              className="flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#f2f2f3] text-xs font-semibold text-[#1c1c1e] transition-colors hover:bg-[#1c1c1e] hover:text-white"
            >
              <TrashIcon className="h-3.5 w-3.5" />
              {product.status === "active" ? "Delete" : "Restore"}
            </button>
          </div>
        )} */}
      </div>
    </div>
  );
}

export const AdminProductCard = memo(AdminProductCardBase);
