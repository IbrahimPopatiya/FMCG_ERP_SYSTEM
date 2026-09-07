import { memo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ProductStatusBadge } from "@/components/products/ProductStatusBadge";
import { NoProductImage } from "@/components/ui/NoProductImage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { UploadCloudIcon, TrashIcon } from "@/components/admin/icons";
import { formatCurrency } from "@/lib/utils/format";
import { uploadFile } from "@/lib/api/fileUploads";
import { useDeleteProduct, useUpdateProduct } from "@/lib/hooks/useProductMutations";
import type { ProductResponse } from "@/types/product";

interface AdminProductCardProps {
  product: ProductResponse;
  onToggleStatus: (product: ProductResponse) => void;
  priority?: boolean;
}

// Same card shape as the customer storefront's CustomerProductCard (square
// image, name, SKU, price) so admin's catalog reads as the same product
// grid — just with Edit/Delete in place of Add to Cart.
function AdminProductCardBase({ product, priority }: AdminProductCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const updateProduct = useUpdateProduct(product.id);
  const deleteProduct = useDeleteProduct();

  function handleDeleteConfirmed() {
    deleteProduct.mutate(product.id, {
      onSuccess: () => setIsConfirmingDelete(false),
    });
  }

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    // Show the picked file immediately (local blob URL) instead of a bare
    // spinner - the real upload+save still runs in the background, but the
    // admin sees their image right away instead of a multi-second blank gap.
    const objectUrl = URL.createObjectURL(file);
    setLocalPreview(objectUrl);
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, "products");
      await updateProduct.mutateAsync({ image: uploaded.file_url });
      // The cache now holds the real uploaded URL (see useUpdateProduct) -
      // drop the local blob preview so we render that instead.
      setLocalPreview(null);
    } catch {
      // Best-effort quick upload — admin can retry, or use the full edit
      // screen if it keeps failing.
      setLocalPreview(null);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }

  const displayImage = localPreview ?? product.image;

  return (
    <div className="relative flex flex-col overflow-hidden rounded-xl border border-border bg-white shadow-sm transition-shadow hover:shadow-md">
      {/* Overlay buttons (upload, delete) live in this wrapper - not inside
          the Link - so they're plain button clicks, not a navigation the
          anchor could still swallow. */}
      <div className="relative">
        <Link
          href={`/admin/products/${product.id}`}
          className="relative flex aspect-square items-center justify-center bg-surface"
        >
          {displayImage ? (
            <Image
              src={displayImage}
              alt={product.name}
              fill
              sizes="(min-width: 640px) 200px, 50vw"
              unoptimized={displayImage.startsWith("blob:")}
              priority={priority}
              className="object-cover"
            />
          ) : (
            <NoProductImage />
          )}
        </Link>

        <div className="absolute left-2 top-2">
          <ProductStatusBadge status={product.status} />
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelected}
        />

        {!displayImage && (
          <button
            type="button"
            aria-label="Upload product image"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white text-ink shadow-md transition-colors hover:bg-primary hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UploadCloudIcon className="h-4 w-4" />
          </button>
        )}

        {isUploading && (
          <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-md">
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink/40 border-t-ink" />
          </div>
        )}

        <button
          type="button"
          aria-label="Delete product"
          onClick={() => setIsConfirmingDelete(true)}
          className="absolute bottom-2 right-2 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-red-600 shadow-md transition-colors hover:bg-red-600 hover:text-white"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <Link href={`/admin/products/${product.id}`}>
          <p className="line-clamp-2 text-sm font-medium leading-snug text-ink">{product.name}</p>
        </Link>
        <p className="text-xs text-ink-muted">{product.sku}</p>
        <p className="text-xs text-ink-muted">LC: {product.loading_capacity}</p>
        <p className="text-sm">
          <span className="font-semibold text-ink">{formatCurrency(product.selling_price) + "/" + (product.mrp)}</span>
        </p>
      </div>

      <ConfirmDialog
        open={isConfirmingDelete}
        title="Delete product?"
        message={`"${product.name}" will be permanently removed from the catalog. This can't be undone.`}
        confirmLabel="Delete"
        tone="danger"
        isConfirming={deleteProduct.isPending}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </div>
  );
}

export const AdminProductCard = memo(AdminProductCardBase);
