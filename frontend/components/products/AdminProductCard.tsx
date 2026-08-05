import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductResponse } from "@/types/product";

interface AdminProductCardProps {
  product: ProductResponse;
  onToggleStatus: (product: ProductResponse) => void;
}

// Same card shape as the customer storefront's CustomerProductCard (square
// image, name, SKU, price) so admin's catalog reads as the same product
// grid — just with Edit/Delete in place of Add to Cart.
function AdminProductCardBase({ product }: AdminProductCardProps) {
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
    </div>
  );

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/admin/products/${product.id}`}>{imageBlock}</Link>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/admin/products/${product.id}`}>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-muted">{product.sku}</p>
        <p className="text-xs text-ink-muted">LC: {product.loading_capacity}</p>
        <p className="text-sm">
          <span className="font-semibold text-ink">{formatCurrency(product.selling_price) + "/" + (product.mrp)}</span>
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
