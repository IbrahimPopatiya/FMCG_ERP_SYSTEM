"use client";

import { SubmitEvent, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Combobox } from "@/components/ui/Combobox";
import { ProductImageField } from "@/components/products/ProductImageField";
import { useBrands } from "@/lib/hooks/useBrands";
import { useCategories } from "@/lib/hooks/useCategories";
import { uploadFile } from "@/lib/api/fileUploads";
import { createBrand } from "@/lib/api/brands";
import { createCategory } from "@/lib/api/categories";
import type { ProductCreate } from "@/types/product";

export interface ProductFormValues {
  name: string;
  category_name: string;
  brand_name: string;
  unit: string;
  units_per_box: string;
  loading_capacity: string;
  mrp: string;
  selling_price: string;
  minimum_stock: string;
  imageUrl: string | null;
  imageFile: File | null;
}

export const EMPTY_PRODUCT_FORM: ProductFormValues = {
  name: "",
  category_name: "",
  brand_name: "",
  unit: "",
  units_per_box: "1",
  loading_capacity: "",
  mrp: "",
  selling_price: "",
  minimum_stock: "",
  imageUrl: null,
  imageFile: null,
};

/** Resolves a typed brand/category name to an existing id (case-insensitive
 * match) or creates a new one — this is what makes the combobox fields
 * double as an "add new" form. */
async function resolveCategoryId(
  name: string,
  categories: { id: string; name: string }[]
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;
  const created = await createCategory({ name: trimmed });
  return created.id;
}

async function resolveBrandId(
  name: string,
  brands: { id: string; name: string }[]
): Promise<string | null> {
  const trimmed = name.trim();
  if (!trimmed) return null;
  const existing = brands.find((b) => b.name.toLowerCase() === trimmed.toLowerCase());
  if (existing) return existing.id;
  const created = await createBrand({ name: trimmed });
  return created.id;
}

async function toPayload(
  values: ProductFormValues,
  image: string | null,
  categories: { id: string; name: string }[],
  brands: { id: string; name: string }[]
): Promise<ProductCreate> {
  const [category_id, brand_id] = await Promise.all([
    resolveCategoryId(values.category_name, categories),
    resolveBrandId(values.brand_name, brands),
  ]);
  return {
    name: values.name.trim(),
    category_id,
    brand_id,
    unit: values.unit.trim(),
    units_per_box: Number(values.units_per_box),
    loading_capacity: Number(values.loading_capacity),
    mrp: Number(values.mrp),
    selling_price: Number(values.selling_price),
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
  const queryClient = useQueryClient();

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
      const payload = await toPayload(values, image, categories.data ?? [], brands.data ?? []);
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["brands"] });
      await onSubmit(payload);
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
          <Combobox
            id="category_name"
            label="Category"
            value={values.category_name}
            onChange={(v) => set("category_name", v)}
            placeholder="Search or add a category…"
            emptyOptionLabel="No category"
            options={categories.data?.map((c) => ({ value: c.id, label: c.name })) ?? []}
          />
          <Combobox
            id="brand_name"
            label="Brand"
            value={values.brand_name}
            onChange={(v) => set("brand_name", v)}
            placeholder="Search or add a brand…"
            emptyOptionLabel="No brand"
            options={brands.data?.map((b) => ({ value: b.id, label: b.name })) ?? []}
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
            type="text"
            inputMode="numeric"
            placeholder="e.g. 12"
            value={values.units_per_box}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) set("units_per_box", e.target.value);
            }}
            required
          />
          <Input
            id="loading_capacity"
            label="Loading capacity (LC)"
            type="text"
            inputMode="numeric"
            placeholder="e.g. 500"
            value={values.loading_capacity}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) set("loading_capacity", e.target.value);
            }}
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
            type="text"
            inputMode="decimal"
            value={values.mrp}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) set("mrp", e.target.value);
            }}
            required
          />
          <Input
            id="selling_price"
            label="Selling price (₹)"
            type="text"
            inputMode="decimal"
            value={values.selling_price}
            onChange={(e) => {
              if (/^\d*\.?\d*$/.test(e.target.value)) set("selling_price", e.target.value);
            }}
            required
          />
          <Input
            id="minimum_stock"
            label="Minimum stock"
            type="text"
            inputMode="numeric"
            value={values.minimum_stock}
            onChange={(e) => {
              if (/^\d*$/.test(e.target.value)) set("minimum_stock", e.target.value);
            }}
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
