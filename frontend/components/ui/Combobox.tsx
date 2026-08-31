"use client";

import { useEffect, useRef, useState } from "react";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  label?: string;
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  emptyOptionLabel?: string;
}

// A searchable text input with a filtered dropdown of existing options —
// unlike Select, typing a name that isn't in the list is a valid choice
// (the caller creates it on submit), so this is text-in/text-out rather
// than value/id based.
export function Combobox({
  label,
  id,
  value,
  onChange,
  options,
  placeholder = "Type to search or add new…",
  emptyOptionLabel,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const search = value.trim().toLowerCase();
  const filtered = search
    ? options.filter((o) => o.label.toLowerCase().includes(search))
    : options;

  const exactMatch = options.some((o) => o.label.toLowerCase() === search);
  const showCreateOption = search.length > 0 && !exactMatch;

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          type="text"
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(true);
          }}
          className="h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
        {isOpen && (
          <div className="absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-lg border border-border bg-white p-1 shadow-lg">
            {emptyOptionLabel && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange("");
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-primary-soft"
              >
                {emptyOptionLabel}
              </button>
            )}
            {filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(option.label);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm text-ink hover:bg-primary-soft"
              >
                {option.label}
              </button>
            ))}
            {showCreateOption && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(false)}
                className="flex w-full items-center gap-1.5 rounded-md px-3 py-2 text-left text-sm font-medium text-primary hover:bg-primary-soft"
              >
                Add “{value.trim()}” as new
              </button>
            )}
            {filtered.length === 0 && !showCreateOption && !emptyOptionLabel && (
              <p className="px-3 py-2 text-sm text-ink-muted">No matches</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
