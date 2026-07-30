"use client";

import { SubmitEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ProductImageField } from "@/components/products/ProductImageField";
import { uploadFile } from "@/lib/api/fileUploads";
import type { PostCreate } from "@/types/post";

interface PostFormValues {
  product_name: string;
  price: string;
  mrp: string;
  quantity_in_box: string;
  imageUrl: string | null;
  imageFile: File | null;
}

const EMPTY_FORM: PostFormValues = {
  product_name: "",
  price: "",
  mrp: "",
  quantity_in_box: "",
  imageUrl: null,
  imageFile: null,
};

interface PostFormProps {
  onSubmit: (payload: PostCreate) => Promise<unknown>;
}

export function PostForm({ onSubmit }: PostFormProps) {
  const [values, setValues] = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) {
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
          const uploaded = await uploadFile(values.imageFile, "posts");
          image = uploaded.file_url;
        } catch {
          setError("Couldn't upload the image. Please try again.");
          return;
        }
      }

      await onSubmit({
        image,
        product_name: values.product_name.trim(),
        price: Number(values.price),
        mrp: Number(values.mrp),
        quantity_in_box: Number(values.quantity_in_box),
      });
    } catch {
      setError("Something went wrong creating this post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-8" noValidate>
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Post details</h2>
        <ProductImageField
          previewUrl={previewUrl}
          onFileSelected={handleImageSelected}
          onRemove={handleImageRemoved}
        />
        <Input
          id="product_name"
          label="Product name"
          placeholder="e.g. Coca-Cola 500ml"
          value={values.product_name}
          onChange={(e) => set("product_name", e.target.value)}
          required
        />
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-ink">Pricing &amp; quantity</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            id="price"
            label="Price (₹)"
            type="number"
            min="0"
            step="0.01"
            value={values.price}
            onChange={(e) => set("price", e.target.value)}
            required
          />
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
            id="quantity_in_box"
            label="Quantity in box"
            type="number"
            min="1"
            step="1"
            value={values.quantity_in_box}
            onChange={(e) => set("quantity_in_box", e.target.value)}
            required
          />
        </div>
      </section>

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full rounded-full">
          Create Post
        </Button>
      </div>
    </form>
  );
}
