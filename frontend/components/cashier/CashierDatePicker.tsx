"use client";

import { toDateInputValue } from "@/lib/utils/format";

const TODAY = toDateInputValue(new Date());

export function CashierDatePicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        max={TODAY}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border bg-white px-3 text-sm text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
      />
      {value !== TODAY && (
        <button
          type="button"
          onClick={() => onChange(TODAY)}
          className="text-xs font-medium text-primary hover:text-primary-hover"
        >
          Today
        </button>
      )}
    </div>
  );
}

export { TODAY as CASHIER_TODAY };
