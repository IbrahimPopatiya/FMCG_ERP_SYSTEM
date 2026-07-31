"use client";

import { useEffect, useState } from "react";

function readIsDesktop(breakpointPx: number): boolean | null {
  if (typeof window === "undefined") return null;
  return window.matchMedia(`(min-width: ${breakpointPx}px)`).matches;
}

// The server (and SSR's first pass) knows nothing about viewport size, so
// this reads `null` there and resolves to the real value as soon as this
// runs on the client - callers should treat `null` as "don't know yet"
// (e.g. render nothing rather than guessing) to avoid a flash of the wrong
// layout.
export function useIsDesktop(breakpointPx = 640): boolean | null {
  const [isDesktop, setIsDesktop] = useState<boolean | null>(() => readIsDesktop(breakpointPx));

  useEffect(() => {
    const query = window.matchMedia(`(min-width: ${breakpointPx}px)`);
    const onChange = (event: MediaQueryListEvent) => setIsDesktop(event.matches);
    query.addEventListener("change", onChange);
    return () => query.removeEventListener("change", onChange);
  }, [breakpointPx]);

  return isDesktop;
}
