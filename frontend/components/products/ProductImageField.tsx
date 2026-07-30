"use client";

import { useRef } from "react";
import { UploadCloudIcon } from "@/components/admin/icons";

interface ProductImageFieldProps {
  previewUrl: string | null;
  onFileSelected: (file: File) => void;
  onRemove: () => void;
}

export function ProductImageField({ previewUrl, onFileSelected, onRemove }: ProductImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) onFileSelected(file);
    event.target.value = "";
  }

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium text-ink">Product image</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group relative flex w-full flex-col items-center justify-center gap-2 overflow-hidden rounded-2xl border-2 border-dashed border-border bg-surface px-4 py-8 text-center transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Product preview" className="h-32 w-32 rounded-xl object-cover" />
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
