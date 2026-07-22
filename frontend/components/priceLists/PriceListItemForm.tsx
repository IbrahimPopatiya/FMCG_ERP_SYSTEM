"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { PriceListItemCreate } from "@/types/priceLists";
import type { ProductCatalogResponse } from "@/types/product";

interface PriceListItemFormProps {
  products: ProductCatalogResponse[];
  onSubmit: (payload: PriceListItemCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function PriceListItemForm({ products, onSubmit, onSuccess }: PriceListItemFormProps) {
  const [productId, setProductId] = useState("");
  const [discountPercent, setDiscountPercent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    if (!productId) {
      setError("Choose a product.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit({ product_id: productId, discount_percent: Number(discountPercent) || 0 });
      setProductId("");
      setDiscountPercent("");
      onSuccess();
    } catch {
      setError("Something went wrong adding this product. It may already be in this price list.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <Select
        id="product_id"
        label="Product"
        value={productId}
        onValueChange={setProductId}
        placeholder="Choose a product"
        options={products.map((p) => ({ value: p.id, label: p.name }))}
      />
      <Input
        id="discount_percent"
        label="Discount %"
        type="number"
        min={0}
        max={100}
        step="0.01"
        value={discountPercent}
        onChange={(e) => setDiscountPercent(e.target.value)}
        required
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Add product
        </Button>
      </div>
    </form>
  );
}
