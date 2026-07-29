interface QtyStepperProps {
  qty: number;
  onChange: (qty: number) => void;
  size?: "sm" | "md";
}

export function QtyStepper({ qty, onChange, size = "md" }: QtyStepperProps) {
  const dimension = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";

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
      <span className="w-6 text-center text-sm font-semibold text-ink">{qty}</span>
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
