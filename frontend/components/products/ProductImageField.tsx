"use client";

import { useRef } from "react";
import Image from "next/image";
import { UploadCloudIcon } from "@/components/admin/icons";

interface ProductImageFieldProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
  label?: string;
}

export function ProductImageField({
  previewUrl,
  onFileSelected,
  onRemove,
  label = "Product image",
}: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
      >
        {previewUrl ? (
          <Image
            src={previewUrl}
            alt="Product preview"
            width={128}
            height={128}
            // A freshly-picked file is previewed via a local blob: URL, which
            // only exists in this browser tab - Next's image optimizer can't
            // fetch it server-side, so skip optimization for that case.
            unoptimized={previewUrl.startsWith("blob:")}
            className="h-32 w-32 rounded-xl object-cover"
          />
        ) : (
          <>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
              <UploadCloudIcon className="h-6 w-6" />
            </div>
            <p className="text-sm font-semibold text-ink">Tap to upload</p>
            <p className="text-xs text-ink-muted">JPG, PNG up to 5MB</p>
          </>
        )}
      </button>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />

      {previewUrl && (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            Change image
          </button>
          <button type="button" onClick={onRemove} className="text-sm font-medium text-danger hover:text-danger-hover">
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
