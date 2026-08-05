"use client";

import { SubmitEvent, useState } from "react";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ProductImageField } from "@/components/products/ProductImageField";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategories } from "@/lib/hooks/useCategories";
import { uploadFile } from "@/lib/api/fileUploads";
import type { ProductCreate } from "@/types/product";

export interface ProductFormValues {
  name: string;
  category_id: string;
  brand_id: string;
  unit: string;
  units_per_box: string;
  mrp: string;
  selling_price: string;
  minimum_stock: string;
  // Not shown or editable in this form - GST rate is set elsewhere. Carried
  // through so editing a product doesn't silently reset its existing rate.
  gst_rate: string;
  imageUrl: string | null;
  imageFile: File | null;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  category_id: "",
  brand_id: "",
  unit: "",
  units_per_box: "1",
  mrp: "",
  selling_price: "",
  minimum_stock: "",
  gst_rate: "0",
  imageUrl: null,
  imageFile: null,
};

function toPayload(values: ProductFormValues, image: string | null): ProductCreate {
  return {
    name: values.name.trim(),
    category_id: values.category_id || null,
    brand_id: values.brand_id || null,
    unit: values.unit.trim(),
    units_per_box: Number(values.units_per_box),
    mrp: Number(values.mrp),
    selling_price: Number(values.selling_price),
    gst_rate: Number(values.gst_rate),
    minimum_stock: Number(values.minimum_stock),
    image,
  };
}

function submitErrorMessage(error: unknown): string {
  if (isAxiosError(error) && error.response?.status === 409) {
    return "A product with this name already exists.";
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(initialValues.imageUrl);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const brands = useBrands();
  const categories = useCategories();

  function set<K extends keyof ProductFormValues>(key: K, value: ProductFormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageSelected(file: File) {
    set("imageFile", file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleImageRemoved() {
    set("imageFile", null);
    set("imageUrl", null);
    setPreviewUrl(null);
  }

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      let image = values.imageUrl;
      if (values.imageFile) {
        try {
          const uploaded = await uploadFile(values.imageFile, "products");
          image = uploaded.file_url;
        } catch {
          setError("Couldn't upload the image. Please try again.");
          return;
        }
      }
      await onSubmit(toPayload(values, image));
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
        <ProductImageField
          previewUrl={previewUrl}
          onFileSelected={handleImageSelected}
          onRemove={handleImageRemoved}
        />
        <Input
          id="name"
          label="Product name"
          placeholder="e.g. Coca-Cola 500ml"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          required
        />
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
            id="units_per_box"
            label="Units per box"
            type="number"
            min="1"
            step="1"
            placeholder="e.g. 12"
            value={values.units_per_box}
            onChange={(e) => set("units_per_box", e.target.value)}
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
