import { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  trailing?: ReactNode;
}

export function Input({ label, error, trailing, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          aria-invalid={!!error}
          className={`h-11 w-full rounded-lg border px-3.5 text-sm text-ink placeholder:text-ink-muted/60 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 ${
            error
              ? "border-red-300 focus:border-red-400 focus:ring-red-200"
              : "border-border focus:border-primary focus:ring-primary-soft"
          } ${trailing ? "pr-11" : ""} ${className}`}
          {...props}
        />
        {trailing && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">{trailing}</div>
        )}
      </div>
      {error && <p className="text-xs font-medium text-red-600">{error}</p>}
    </div>
  );
}
