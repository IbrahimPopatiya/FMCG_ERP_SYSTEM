"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ProductImageField } from "@/components/products/ProductImageField";
import { uploadFile } from "@/lib/api/fileUploads";
import type { PostCreate } from "@/types/post";

interface PostFormProps {
  onSubmit: (payload: PostCreate) => Promise<unknown>;
  onSuccess: () => void;
}

export function PostForm({ onSubmit, onSuccess }: PostFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleImageSelected(file: File) {
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function handleImageRemoved() {
    setImageFile(null);
    setPreviewUrl(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!imageFile) {
      setError("Please add an image for this post.");
      return;
    }

    setIsSubmitting(true);
    try {
      let image: string | null = null;
      try {
        const uploaded = await uploadFile(imageFile, "posts");
        image = uploaded.file_url;
      } catch {
        setError("Couldn't upload the image. Please try again.");
        return;
      }

      await onSubmit({ image });
      onSuccess();
    } catch {
      setError("Something went wrong creating this post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
      <ProductImageField
        previewUrl={previewUrl}
        onFileSelected={handleImageSelected}
        onRemove={handleImageRemoved}
      />

      {error && (
        <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">{error}</div>
      )}

      <div className="flex justify-end pt-1">
        <Button type="submit" isLoading={isSubmitting} className="w-full sm:w-auto">
          Create post
        </Button>
      </div>
    </form>
  );
}
