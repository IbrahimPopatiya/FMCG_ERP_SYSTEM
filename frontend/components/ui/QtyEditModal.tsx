"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";

interface QtyEditModalProps {
  open: boolean;
  qty: number;
  label: string;
  title: string;
  min?: number;
  onConfirm: (qty: number) => void;
  onClose: () => void;
}

// Shared popup for editing a single number tied to a cart line — either the
// box quantity (tapping the qty stepper) or the pieces-per-box (tapping the
// "N pcs/box" text). See CartPage for both call sites.
export function QtyEditModal({ open, qty, label, title, min = 0, onConfirm, onClose }: QtyEditModalProps) {
  const [text, setText] = useState(String(qty));

  useEffect(() => {
    if (open) setText(String(qty));
  }, [open, qty]);

  function confirm() {
    const parsed = parseInt(text, 10);
    onConfirm(Number.isFinite(parsed) ? Math.max(min, parsed) : qty);
    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title={`${title} — ${label}`}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            aria-label="Decrease quantity"
            onClick={() => setText(String(Math.max(min, (parseInt(text, 10) || 0) - 1)))}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-lg font-semibold text-ink transition-colors hover:bg-surface active:bg-primary-soft"
          >
            −
          </button>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoFocus
            aria-label="Quantity"
            value={text}
            onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
            onKeyDown={(e) => {
              if (e.key === "Enter") confirm();
            }}
            className="h-11 w-20 rounded-lg border border-border text-center text-lg font-semibold text-ink focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            aria-label="Increase quantity"
            onClick={() => setText(String((parseInt(text, 10) || 0) + 1))}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-lg font-semibold text-ink transition-colors hover:bg-surface active:bg-primary-soft"
          >
            +
          </button>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={confirm}>
            Update
          </Button>
        </div>
      </div>
    </Modal>
  );
}
