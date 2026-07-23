"use client";

import { useEffect, useRef } from "react";

// Watches a sentinel element and fires `onIntersect` when it scrolls into
// view — drop the returned ref on an empty div at the end of a list to get
// scroll-triggered pagination. Shared by every infinite-scroll list screen.
export function useInfiniteScrollSentinel(onIntersect: () => void, enabled: boolean) {
  const ref = useRef<HTMLDivElement | null>(null);
  const onIntersectRef = useRef(onIntersect);

  useEffect(() => {
    onIntersectRef.current = onIntersect;
  });

  useEffect(() => {
    const node = ref.current;
    if (!enabled || !node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onIntersectRef.current();
      },
      { rootMargin: "200px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled]);

  return ref;
}
