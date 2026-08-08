"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { ProductImageField } from "@/components/products/ProductImageField";
import { uploadFile } from "@/lib/api/fileUploads";
import { useCreatePost } from "@/lib/hooks/usePostMutations";

interface CreatePostModalProps {
  open: boolean;
  onClose: () => void;
}

// Minimal "just the photo" post flow (see prd.md Create Post mockup) — no
// product picker or pricing fields, just an image. A lightweight product is
// created behind the scenes by the backend (see post.py's
// _create_product_for_post) so cart/checkout still has something real to
// reference; those placeholder values never surface anywhere customers see
// pricing, since the post itself only ever renders the image.
export function CreatePostModal({ open, onClose }: CreatePostModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const createPost = useCreatePost();

  function reset() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleFileSelected(selected: File) {
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setError(null);
  }

  async function handleCreate() {
    if (!file) {
      setError("Please upload an image first.");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const uploaded = await uploadFile(file, "posts");
      await createPost.mutateAsync({
        image: uploaded.file_url,
        product_name: "Featured post",
        price: 0,
        mrp: 0,
        quantity_in_box: 1,
      });
      handleClose();
    } catch {
      setError("Couldn't create the post. Please try again.");
    } finally {
      setIsUploading(false);
    }
  }

  const isSubmitting = isUploading || createPost.isPending;

  return (
    <Modal open={open} onClose={handleClose} title="Create post">
      <div className="flex flex-col gap-4">
        <ProductImageField
          previewUrl={previewUrl}
          onFileSelected={handleFileSelected}
          onRemove={() => {
            setFile(null);
            setPreviewUrl(null);
          }}
          label="Post image"
        />

        {error && <p className="text-sm font-medium text-danger">{error}</p>}

        <Button type="button" onClick={handleCreate} isLoading={isSubmitting} disabled={!file} className="w-full">
          Create post
        </Button>
      </div>
    </Modal>
  );
}
