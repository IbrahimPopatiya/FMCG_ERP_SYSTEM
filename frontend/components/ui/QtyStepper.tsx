"use client";

import { useEffect, useState } from "react";

interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
}

export function QtyStepper({ qty, onChange, size = "md" }: QtyStepperProps) {
  const dimension = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";
  const [text, setText] = useState(String(qty));

  // Keep the input in sync with external qty changes (e.g. the +/- buttons,
  // or the cart updating elsewhere) without fighting the user mid-type.
  useEffect(() => {
    setText(String(qty));
  }, [qty]);

  function commit(raw: string) {
    const parsed = parseInt(raw, 10);
    const next = Number.isFinite(parsed) ? Math.max(0, parsed) : qty;
    onChange(next);
    setText(String(next));
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => onChange(Math.max(0, qty - 1))}
        className={`flex ${dimension} items-center justify-center rounded-lg border border-border font-semibold text-ink transition-colors hover:bg-surface active:bg-primary-soft`}
      >
        −
      </button>
      <input
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        aria-label="Quantity"
        value={text}
        onChange={(e) => setText(e.target.value.replace(/[^0-9]/g, ""))}
        onBlur={() => commit(text)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        className={`w-10 rounded-lg border border-border text-center text-sm font-semibold text-ink focus:border-primary focus:outline-none ${
          size === "sm" ? "h-8" : "h-10"
        }`}
      />
      <button
        type="button"
        aria-label="Increase quantity"
        onClick={() => onChange(qty + 1)}
        className={`flex ${dimension} items-center justify-center rounded-lg border border-border font-semibold text-ink transition-colors hover:bg-surface active:bg-primary-soft`}
      >
        +
      </button>
    </div>
  );
}
