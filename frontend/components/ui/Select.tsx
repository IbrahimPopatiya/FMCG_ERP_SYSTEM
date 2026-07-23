"use client";

import * as RadixSelect from "@radix-ui/react-select";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  label?: string;
  error?: string;
  id?: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  options: SelectOption[];
}

// Native <select> popups can't be restyled (they render as raw OS chrome on
// every platform) — this uses Radix's unstyled primitive so the trigger and
// dropdown both match the rest of the design system.
export function Select({
  label,
  error,
  id,
  value,
  onValueChange,
  placeholder = "Select…",
  options,
}: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <RadixSelect.Root value={value} onValueChange={onValueChange}>
        <RadixSelect.Trigger
          id={id}
          aria-invalid={!!error}
          className={`flex h-11 w-full items-center justify-between gap-2 rounded-lg border bg-white px-3.5 text-sm text-ink outline-none transition-colors data-[placeholder]:text-ink-muted/60 focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-200"
              : "border-border focus:border-primary focus:ring-primary-soft data-[state=open]:border-primary data-[state=open]:ring-2 data-[state=open]:ring-primary-soft"
          }`}
        >
          <RadixSelect.Value placeholder={placeholder} />
          <RadixSelect.Icon className="text-ink-muted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </RadixSelect.Icon>
        </RadixSelect.Trigger>

        <RadixSelect.Portal>
          <RadixSelect.Content
            position="popper"
            sideOffset={6}
            className="z-50 overflow-hidden rounded-lg border border-border bg-white shadow-lg"
          >
            <RadixSelect.Viewport className="max-h-64 w-[var(--radix-select-trigger-width)] p-1">
              {options.map((option) => (
                <RadixSelect.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-3 py-2 text-sm text-ink outline-none data-[highlighted]:bg-primary-soft data-[state=checked]:font-medium"
                >
                  <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
                  <RadixSelect.ItemIndicator className="text-primary">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </RadixSelect.ItemIndicator>
                </RadixSelect.Item>
              ))}
            </RadixSelect.Viewport>
          </RadixSelect.Content>
        </RadixSelect.Portal>
      </RadixSelect.Root>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
