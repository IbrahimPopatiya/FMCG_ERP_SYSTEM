import Link from "next/link";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { DiscountBadge } from "@/components/customer/DiscountBadge";
import { formatCurrency } from "@/lib/utils/format";
import type { ProductCatalogResponse } from "@/types/product";

interface CustomerProductCardProps {
  product: ProductCatalogResponse;
  qty: number;
  onQtyChange: (qty: number) => void;
}

export function CustomerProductCard({ product, qty, onQtyChange }: CustomerProductCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/products/${product.id}`} className="relative block">
        <div className="flex aspect-square items-center justify-center bg-primary-soft">
          {product.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-xs font-medium text-primary/60">{product.unit}</span>
          )}
        </div>
        <div className="absolute left-2 top-2">
          <DiscountBadge mrp={product.mrp} effectivePrice={product.effective_price} />
        </div>
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <Link href={`/products/${product.id}`}>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-muted">{product.packing}</p>
        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div>
            <p className="text-sm font-semibold text-ink">{formatCurrency(product.effective_price)}</p>
            {product.mrp > product.effective_price && (
              <p className="text-xs text-ink-muted line-through">{formatCurrency(product.mrp)}</p>
            )}
          </div>
          {qty === 0 ? (
            <button
              type="button"
              onClick={() => onQtyChange(1)}
              className="h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Add
            </button>
          ) : (
            <QtyStepper qty={qty} onChange={onQtyChange} size="sm" />
          )}
        </div>
      </div>
    </div>
  );
}
