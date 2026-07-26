"use client";

import { useState } from "react";
import Link from "next/link";
import { DiscountBadge } from "@/components/customer/DiscountBadge";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { BookmarkIcon, CommentIcon, HeartIcon, ShareIcon } from "@/components/customer/icons";
import { formatCurrency } from "@/lib/utils/format";
import { baseLikeCount } from "@/lib/hooks/useFeedEngagement";
import type { ProductCatalogResponse } from "@/types/product";

interface ProductPostCardProps {
  product: ProductCatalogResponse;
  postedAgo: string;
  qty: number;
  liked: boolean;
  wishlisted: boolean;
  onAdd: () => void;
  onQtyChange: (qty: number) => void;
  onToggleLike: () => void;
  onToggleWishlist: () => void;
}

export function ProductPostCard({
  product,
  postedAgo,
  qty,
  liked,
  wishlisted,
  onAdd,
  onQtyChange,
  onToggleLike,
  onToggleWishlist,
}: ProductPostCardProps) {
  const [justLiked, setJustLiked] = useState(false);
  const likeCount = baseLikeCount(product.id) + (liked ? 1 : 0);

  function handleLike() {
    if (!liked) {
      setJustLiked(true);
      window.setTimeout(() => setJustLiked(false), 300);
    }
    onToggleLike();
  }

  async function handleShare() {
    const url = typeof window !== "undefined" ? `${window.location.origin}/products/${product.id}` : "";
    const shareData = { title: product.name, text: `Check out ${product.name} on our store`, url };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // user cancelled — no-op
      }
      return;
    }
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  }

  return (
    <article className="overflow-hidden rounded-[18px] border border-border bg-white shadow-[0_4px_18px_-6px_rgba(20,35,26,0.12)]">
      {/* Post header */}
      <div className="flex items-center justify-between px-4 pt-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
            SW
          </div>
          <div>
            <p className="text-sm font-semibold text-ink">Sharma Wholesale</p>
            <p className="text-xs text-ink-muted">{postedAgo}</p>
          </div>
        </div>
        <button
          type="button"
          aria-label="More options"
          className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted hover:bg-surface"
        >
          <span className="text-lg leading-none">⋮</span>
        </button>
      </div>

      {/* Post image */}
      <Link href={`/products/${product.id}`} className="relative mt-3 block aspect-video w-full bg-primary-soft">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm font-medium text-primary/60">
            {product.name}
          </div>
        )}
        <div className="absolute left-3 top-3">
          <DiscountBadge mrp={product.mrp} effectivePrice={product.effective_price} />
        </div>
      </Link>

      {/* Product info */}
      <div className="px-4 pt-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-base font-bold leading-snug text-ink">{product.name}</h3>
        </Link>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-xl font-bold text-primary">{formatCurrency(product.effective_price)}</span>
          {product.mrp > product.effective_price && (
            <span className="text-sm text-ink-muted line-through">{formatCurrency(product.mrp)}</span>
          )}
        </div>
        <p className="mt-0.5 text-xs text-ink-muted">{product.packing}</p>
      </div>

      {/* Action row */}
      <div className="mt-3 flex items-center justify-between px-4 pb-2">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            aria-label={liked ? "Unlike" : "Like"}
            className="flex items-center gap-1.5 text-ink-muted hover:text-red-500"
          >
            <HeartIcon
              className={`h-6 w-6 transition-transform ${justLiked ? "scale-125" : "scale-100"} ${
                liked ? "text-red-500" : ""
              }`}
              filled={liked}
            />
          </button>
          <span className="flex items-center gap-1.5 text-ink-muted">
            <CommentIcon className="h-5 w-5" />
            <span className="text-xs">{Math.max(4, Math.round(likeCount / 12))}</span>
          </span>
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="text-ink-muted hover:text-primary"
          >
            <ShareIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            className="flex h-10 w-10 items-center justify-center text-ink hover:text-primary"
          >
            <BookmarkIcon
              className={`h-6 w-6 transition-transform ${wishlisted ? "scale-110 text-primary" : ""}`}
              filled={wishlisted}
            />
          </button>
          {qty === 0 ? (
            <button
              type="button"
              onClick={onAdd}
              aria-label="Add to cart"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow-sm hover:bg-primary-hover"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
                <path d="M6 6h15l-1.5 9h-12z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 6L5 3H2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
              </svg>
            </button>
          ) : (
            <QtyStepper qty={qty} onChange={onQtyChange} size="sm" />
          )}
        </div>
      </div>

      {/* Like counter */}
      <div className="border-t border-border px-4 py-2.5">
        <p className="text-sm font-semibold text-ink">
          ❤ {likeCount.toLocaleString("en-IN")} Likes
        </p>
      </div>
    </article>
  );
}
