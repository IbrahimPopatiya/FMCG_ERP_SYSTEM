"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const LIKES_KEY = "dms_feed_likes";
const WISHLIST_KEY = "dms_feed_wishlist";

function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? new Set<string>(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

// Deterministic per-product "base" like count so the feed feels alive without
// a backend counter yet — same product always shows the same base number.
export function baseLikeCount(productId: string): number {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 31 + productId.charCodeAt(i)) >>> 0;
  }
  return 60 + (hash % 400);
}

export function postedAgoLabel(productId: string, index: number): string {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash * 17 + productId.charCodeAt(i)) >>> 0;
  }
  const hours = ((hash + index) % 22) + 1;
  return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
}

// Likes and wishlist saves are customer-local interactions (no order/stock
// impact), so they persist the same way the cart does — localStorage,
// following the CartProvider pattern rather than a new backend endpoint.
export function useFeedEngagement() {
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read from localStorage on mount
    setLiked(readSet(LIKES_KEY));
    setWishlisted(readSet(WISHLIST_KEY));
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(LIKES_KEY, JSON.stringify([...liked]));
  }, [liked, isHydrated]);

  useEffect(() => {
    if (!isHydrated) return;
    window.localStorage.setItem(WISHLIST_KEY, JSON.stringify([...wishlisted]));
  }, [wishlisted, isHydrated]);

  const toggleLike = useCallback((productId: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  return useMemo(
    () => ({
      isLiked: (productId: string) => liked.has(productId),
      isWishlisted: (productId: string) => wishlisted.has(productId),
      toggleLike,
      toggleWishlist,
    }),
    [liked, wishlisted, toggleLike, toggleWishlist]
  );
}
