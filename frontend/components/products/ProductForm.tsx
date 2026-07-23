"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategories } from "@/lib/hooks/useCategories";
import type { ProductCreate } from "@/types/product";

export interface ProductFormValues {
  sku: string;
  barcode: string;
  name: string;
  category_id: string;
  brand_id: string;
  unit: string;
  packing: string;
  mrp: string;
  selling_price: string;
  gst_rate: string;
  minimum_stock: string;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  sku: "",
  barcode: "",
  name: "",
  category_id: "",
  brand_id: "",
  unit: "",
  packing: "",
  mrp: "",
  selling_price: "",
  gst_rate: "",
  minimum_stock: "",
};

function toPayload(values: ProductFormValues): ProductCreate {
  return {
    sku: values.sku.trim(),
    barcode: values.barcode.trim(),
    name: values.name.trim(),
    category_id: values.category_id || null,
    brand_id: values.brand_id || null,
    unit: values.unit.trim(),
    packing: values.packing.trim(),
    mrp: Number(values.mrp),
    selling_price: Number(values.selling_price),
    gst_rate: Number(values.gst_rate),
    minimum_stock: Number(values.minimum_stock),
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A product with this SKU or barcode already exists.";
  }
  return "Something went wrong saving this product. Please try again.";
}

interface ProductFormProps {
  initialValues?: ProductFormValues;
  submitLabel: string;
  onSubmit: (payload: ProductCreate) => Promise<unknown>;
}

export function ProductForm({
  initialValues = EMPTY_PRODUCT_FORM,
  submitLabel,
  onSubmit,
}: ProductFormProps) {
  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brands = useBrands();
  const categories = useCategories();

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSubmit(toPayload(values));
    } catch (err) {
      setError(submitErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Identification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="sku"
            label="SKU"
            placeholder="e.g. SKU-1001"
            value={values.sku}
            onChange={(e) => set("sku", e.target.value)}
            required
          />
          <Input
            id="barcode"
            label="Barcode"
            placeholder="e.g. 8901234567890"
            value={values.barcode}
            onChange={(e) => set("barcode", e.target.value)}
            required
          />
          <div className="sm:col-span-2">
            <Input
              id="name"
              label="Product name"
              placeholder="e.g. Coca-Cola 500ml"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Classification</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select
            id="category_id"
            label="Category"
            value={values.category_id || "none"}
            onValueChange={(v) => set("category_id", v === "none" ? "" : v)}
            options={[
              { value: "none", label: "No category" },
              ...(categories.data?.map((c) => ({ value: c.id, label: c.name })) ?? []),
            ]}
          />
          <Select
            id="brand_id"
            label="Brand"
            value={values.brand_id || "none"}
            onValueChange={(v) => set("brand_id", v === "none" ? "" : v)}
            options={[
              { value: "none", label: "No brand" },
              ...(brands.data?.map((b) => ({ value: b.id, label: b.name })) ?? []),
            ]}
          />
          <Input
            id="unit"
            label="Unit"
            placeholder="e.g. bottle, box, piece"
            value={values.unit}
            onChange={(e) => set("unit", e.target.value)}
            required
          />
          <Input
            id="packing"
            label="Packing"
            placeholder="e.g. 12 x 500ml"
            value={values.packing}
            onChange={(e) => set("packing", e.target.value)}
            required
          />
        </div>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Pricing &amp; stock</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="mrp"
            label="MRP (₹)"
            type="number"
            min="0"
            step="0.01"
            value={values.mrp}
            onChange={(e) => set("mrp", e.target.value)}
            required
          />
          <Input
            id="selling_price"
            label="Selling price (₹)"
            type="number"
            min="0"
            step="0.01"
            value={values.selling_price}
            onChange={(e) => set("selling_price", e.target.value)}
            required
          />
          <Input
            id="gst_rate"
            label="GST rate (%)"
            type="number"
            min="0"
            step="0.01"
            value={values.gst_rate}
            onChange={(e) => set("gst_rate", e.target.value)}
            required
          />
          <Input
            id="minimum_stock"
            label="Minimum stock"
            type="number"
            min="0"
            step="1"
            value={values.minimum_stock}
            onChange={(e) => set("minimum_stock", e.target.value)}
            required
          />
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
