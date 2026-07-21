import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export function Input({ label, id, className = "", ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-zinc-700">
          {label}
        </label>
      )}
      <input
        id={id}
        className={`h-11 rounded-md border border-zinc-300 px-3 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none ${className}`}
        {...props}
      />
    </div>
  );
}
