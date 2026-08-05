import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { DiscountBadge } from "@/components/customer/DiscountBadge";
import { CartIcon } from "@/components/customer/icons";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductCatalogResponse } from "@/types/product";

interface CustomerProductCardProps {
  product: ProductCatalogResponse;
  qty: number;
  // Takes the product itself (not just its id) so the parent's callback
  // doesn't need to depend on the current filtered/sorted list just to look
  // the product back up - that would change identity on every keystroke in
  // search and defeat memoization below.
  onQtyChange: (product: ProductCatalogResponse, qty: number) => void;
}

function CustomerProductCardBase({ product, qty, onQtyChange }: CustomerProductCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="relative block">
        <div className="relative flex aspect-square items-center justify-center bg-primary-soft">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              className="object-cover"
            />
          ) : (
            <span className="text-xs font-medium text-primary/60">{product.unit}</span>
          )}
        </div>
        <div className="absolute left-2 top-2">
          <DiscountBadge mrp={product.mrp} effectivePrice={product.effective_price} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/products/${product.id}`}>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-muted">{product.unit}</p>
        <p className="text-sm">
          <span className="font-semibold text-ink">{formatCurrency(product.effective_price)}</span>
          <span className="ml-0.5 text-xs text-ink-muted">/pc</span>
          {product.mrp > product.effective_price && (
            <span className="ml-1.5 text-xs text-ink-muted line-through">{formatCurrency(product.mrp)}</span>
          )}
        </p>
        <div className="mt-auto pt-1.5">
          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onQtyChange(product, 1)}
              className="flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-soft text-xs font-semibold text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <CartIcon className="h-3.5 w-3.5" />
              Add to Cart
            </button>
          ) : (
            <div className="flex justify-center">
              <QtyStepper qty={qty} onChange={(next) => onQtyChange(product, next)} size="sm" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export const CustomerProductCard = memo(CustomerProductCardBase);
