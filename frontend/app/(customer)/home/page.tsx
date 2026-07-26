"use client";

import { useMemo, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { AccountAvatar } from "@/components/customer/AccountAvatar";
import { ProductPostCard } from "@/components/customer/ProductPostCard";
import { BellIcon, MenuIcon } from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { useProducts } from "@/lib/hooks/useProducts";
import { useFeedEngagement, postedAgoLabel } from "@/lib/hooks/useFeedEngagement";

const PAGE_SIZE = 6;

function PostSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-border bg-white shadow-sm">
      <div className="flex items-center gap-3 p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-2.5 w-20" />
        </div>
      </div>
      <Skeleton className="aspect-video w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export default function HomePage() {
  const customer = useCurrentCustomer();
  const products = useProducts();
  const { addItem, getQty, setQty } = useCart();
  const engagement = useFeedEngagement();
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const feedProducts = useMemo(() => products.data ?? [], [products.data]);
  const visiblePosts = feedProducts.slice(0, visibleCount);
  const hasMore = visibleCount < feedProducts.length;

  return (
    <div className="flex flex-col">
      {/* App header */}
      <header className="sticky top-0 z-10 border-b border-border bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3">
          <button
            type="button"
            aria-label="Menu"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <MenuIcon className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1 text-center">
            <p className="truncate text-base font-bold text-ink">
              {customer.data?.business_name ?? "Your Store"}
            </p>
            <p className="truncate text-xs text-ink-muted">
              📍 {customer.data ? `${customer.data.city}, ${customer.data.state}` : "…"}
            </p>
          </div>

          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink hover:bg-surface"
          >
            <BellIcon className="h-5 w-5" />
          </button>
          <AccountAvatar className="h-9 w-9" />
        </div>
      </header>

      {/* Feed */}
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8">
        {products.isLoading &&
          Array.from({ length: 3 }).map((_, i) => <PostSkeleton key={i} />)}

        {!products.isLoading && feedProducts.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">No posts yet. Check back soon.</p>
        )}

        {visiblePosts.map((product, index) => (
          <ProductPostCard
            key={product.id}
            product={product}
            postedAgo={postedAgoLabel(product.id, index)}
            qty={getQty(product.id)}
            liked={engagement.isLiked(product.id)}
            wishlisted={engagement.isWishlisted(product.id)}
            onAdd={() => addItem(product, 1)}
            onQtyChange={(qty) => setQty(product.id, qty)}
            onToggleLike={() => engagement.toggleLike(product.id)}
            onToggleWishlist={() => engagement.toggleWishlist(product.id)}
          />
        ))}

        {hasMore && (
          <button
            type="button"
            onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
            className="mx-auto rounded-full border border-border bg-white px-6 py-2.5 text-sm font-semibold text-primary shadow-sm hover:bg-primary-soft"
          >
            Load more
          </button>
        )}
      </div>
    </div>
  );
}
