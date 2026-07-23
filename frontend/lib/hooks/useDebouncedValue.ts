"use client";

import { useEffect, useState } from "react";

// Delays reflecting a fast-changing value (e.g. search input) until it's
// stopped changing for `delayMs` — keeps us from firing a request per keystroke.
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timeout);
  }, [value, delayMs]);

  return debounced;
}
