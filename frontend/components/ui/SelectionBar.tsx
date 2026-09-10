"use client";

import { Button } from "@/components/ui/Button";
import { TrashIcon } from "@/components/admin/icons";

// Sticky bar for bulk-selection screens (Product/Brand settings, Order
// settings) — floats above the mobile bottom nav on phones, pins flush to
// the bottom of the panel on desktop.
export function SelectionBar({
  count,
  onClear,
  onDelete,
  isDeleting,
}: {
  count: number;
  onClear: () => void;
  onDelete: () => void;
  isDeleting: boolean;
}) {
  if (count === 0) return null;
  return (
    <div className="sticky bottom-16 z-30 mx-3 flex items-center justify-between gap-3 rounded-xl border border-border bg-white px-3 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.12)] sm:sticky sm:bottom-0 sm:mx-0 sm:rounded-none sm:border-x-0 sm:border-b-0 sm:px-6 sm:py-3 sm:shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
      <div className="flex items-center gap-2.5">
        <span className="text-sm font-semibold text-ink">{count} selected</span>
        <button type="button" onClick={onClear} className="text-sm font-medium text-primary hover:underline">
          Clear
        </button>
      </div>
      <Button type="button" variant="danger" size="sm" onClick={onDelete} isLoading={isDeleting}>
        <TrashIcon className="h-3.5 w-3.5" />
        Delete
      </Button>
    </div>
  );
}
