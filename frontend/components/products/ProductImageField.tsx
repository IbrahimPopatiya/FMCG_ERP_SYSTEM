"use client";

import { useRef } from "react";

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
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-ink">Product image</label>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="group relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-surface transition-colors hover:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-soft"
        >
          {previewUrl ? (
            <img src={previewUrl} alt="Product preview" className="h-full w-full object-cover" />
          ) : (
            <span className="flex flex-col items-center gap-1 text-ink-muted">
              <svg
                className="h-6 w-6"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              <span className="text-xs font-medium">Add image</span>
            </span>
          )}
        </button>

        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-sm font-medium text-primary hover:text-primary-hover"
          >
            {previewUrl ? "Change image" : "Upload image"}
          </button>
          {previewUrl && (
            <button
              type="button"
              onClick={onRemove}
              className="text-sm font-medium text-danger hover:text-danger-hover"
            >
              Remove
            </button>
          )}
          <p className="text-xs text-ink-muted">JPG or PNG, up to 10MB.</p>
        </div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
    </div>
  );
}
