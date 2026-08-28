import { memo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { NoProductImage } from "@/components/ui/NoProductImage";
import { UploadCloudIcon } from "@/components/admin/icons";
import { formatCurrency } from "@/lib/utils/format";
import { uploadFile } from "@/lib/api/fileUploads";
import { useUpdateProduct } from "@/lib/hooks/useProductMutations";
import type { ProductResponse } from "@/types/product";

interface AdminProductCardProps {
  product: ProductResponse;
  onToggleStatus: (product: ProductResponse) => void;
}

// Same card shape as the customer storefront's CustomerProductCard (square
// image, name, SKU, price) so admin's catalog reads as the same product
// grid — just with Edit/Delete in place of Add to Cart.
function AdminProductCardBase({ product }: AdminProductCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const updateProduct = useUpdateProduct(product.id);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, "products");
      await updateProduct.mutateAsync({ image: uploaded.file_url });
    } catch {
      // Best-effort quick upload — admin can retry, or use the full edit
      // screen if it keeps failing.
    } finally {
      setIsUploading(false);
    }
  }

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
          <NoProductImage />
        )}
      </div>
      <div className="absolute left-2 top-2">
        <ProductStatusBadge status={product.status} />
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/admin/products/${product.id}`}>{imageBlock}</Link>

      {/* Outside the Link (not nested in the anchor) so this is a plain
          button click, not a navigation the anchor could still swallow. */}
      {!product.image && (
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />
          <button
            type="button"
            aria-label="Upload product image"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-md transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isUploading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
            ) : (
              <UploadCloudIcon className="h-4 w-4" />
            )}
          </button>
        </>
      )}

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
