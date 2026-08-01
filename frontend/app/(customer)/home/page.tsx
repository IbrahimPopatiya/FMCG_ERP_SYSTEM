"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { Skeleton } from "@/components/ui/Skeleton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import { FilterDrawer } from "@/components/customer/FilterDrawer";
import { useHomeSearch } from "@/components/customer/HomeSearch";
import {
  CartIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  CloseIcon,
  TagIcon,
  SparkleIcon,
  BoxIcon,
  SettingsIcon,
  SearchIcon,
} from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useProducts } from "@/lib/hooks/useProducts";
import { usePosts } from "@/lib/hooks/usePosts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { formatCurrency, formatPackingLabel } from "@/lib/utils/format";
import { dummyProductImage } from "@/lib/utils/dummyProductImage";
import type { ProductCatalogResponse } from "@/types/product";
import type { PostResponse } from "@/types/post";

// A post is a promoted listing referencing a real product — render it in the
// same reel using the product's real id/fields so "Add to bag" etc. still
// work against the underlying product, just with the post's promo image/copy
// layered on top.
function postToFeedItem(post: PostResponse): ProductCatalogResponse {
  return {
    id: post.product_id,
    sku: "",
    name: post.product_name,
    category_id: null,
    brand_id: null,
    unit: "",
    packing: `Box of ${post.quantity_in_box}`,
    units_per_box: post.quantity_in_box,
    mrp: post.mrp,
    effective_price: post.price,
    gst_rate: 0,
    image: post.image,
  };
}

const FEED_COUNT = 8;

// Deterministic pseudo-counts so the same product always shows the same
// like/save numbers across renders, without needing real backend fields.
function fakeCount(seed: string, base: number, spread: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return base + (hash % spread);
}

// Product detail bottom sheet, opened by tapping the product name or the
// reel image — mirrors a native "slide up from the bottom" product card.
// Must match the `duration-300` Tailwind class used below — Tailwind needs a
// static class name to generate the CSS, so this constant only drives the JS
// timer, not the class itself.
const SHEET_TRANSITION_MS = 300;

function ProductDetailSheet({
  product,
  qty,
  onClose,
  onConfirm,
}: {
  product: ProductCatalogResponse;
  qty: number;
  onClose: () => void;
  onConfirm: (qty: number) => void;
}) {
  const [pendingQty, setPendingQty] = useState(qty > 0 ? qty : 1);
  // Starts off-screen/transparent, flips true a frame after mount so the
  // transition actually animates in, and flips back false on close so the
  // slide-down plays before the parent unmounts this component.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, SHEET_TRANSITION_MS);
  }

  return (
    <div
      className={`absolute inset-0 z-30 flex flex-col justify-end transition-colors duration-300 ${
        visible ? "bg-black/40" : "bg-black/0"
      }`}
    >
      <button
        type="button"
        aria-label="Close product details"
        onClick={handleClose}
        className="absolute inset-0"
      />

      <div
        className={`relative flex max-h-[70%] flex-col rounded-t-3xl bg-white p-5 pb-6 shadow-2xl transition-transform duration-300 ease-out ${
          visible ? "translate-y-0" : "translate-y-full"
        }`}
      >
        <div className="mx-auto mb-1 h-1 w-10 shrink-0 rounded-full bg-border" />
        <button
          type="button"
          aria-label="Close"
          onClick={handleClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted hover:bg-border"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="mt-3 flex gap-4 overflow-y-auto">
          <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft">
            <Image
              src={product.image || dummyProductImage(product.name, product.id)}
              alt={product.name}
              fill
              sizes="112px"
              className="object-cover"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2.5">
            <p className="text-lg font-bold leading-snug text-ink">{product.name}</p>

            <div className="flex items-center justify-between gap-2 border-b border-border pb-2 text-sm">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <TagIcon className="h-4 w-4" />
                Selling Price
              </span>
              <span className="font-semibold text-ink">{formatCurrency(product.effective_price)}</span>
            </div>

            {product.mrp > product.effective_price && (
              <div className="flex items-center justify-between gap-2 border-b border-border pb-2 text-sm">
                <span className="flex items-center gap-1.5 text-ink-muted">
                  <SparkleIcon className="h-4 w-4" />
                  MRP
                </span>
                <span className="text-ink-muted line-through">{formatCurrency(product.mrp)}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 pb-1 text-sm">
              <span className="flex items-center gap-1.5 text-ink-muted">
                <BoxIcon className="h-4 w-4" />
                Box Quantity
              </span>
              <span className="font-medium text-ink">{product.packing}</span>
            </div>
          </div>
        </div>

        <div className="mt-5 flex shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-ink-muted">Quantity</span>
            <QtyStepper qty={pendingQty} onChange={(next) => setPendingQty(Math.max(1, next))} />
          </div>

          <button
            type="button"
            onClick={() => onConfirm(pendingQty)}
            className="flex h-12 w-full items-center justify-center rounded-xl bg-primary text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}

function ReelSlide({
  product,
  liked,
  saved,
  qty,
  onToggleLike,
  onToggleSave,
  onShare,
  onOpenBag,
}: {
  product: ProductCatalogResponse;
  liked: boolean;
  saved: boolean;
  qty: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenBag: () => void;
}) {
  return (
    <section className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-white">
      <div className="absolute inset-0 h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || dummyProductImage(product.name, product.id)}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/45 to-transparent" />

      {/* Right action rail — icons float directly on the photo, no card behind them */}
      <div className="absolute bottom-24 right-3 flex flex-col items-center gap-5">
        <button type="button" aria-label="Like" onClick={onToggleLike} className="flex flex-col items-center gap-1">
          <HeartIcon
            className={`h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${liked ? "text-primary" : "text-white"}`}
            filled={liked}
          />
          <span className="text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {fakeCount(product.id, 40, 260) + (liked ? 1 : 0)}
          </span>
        </button>

        <button type="button" aria-label="Save" onClick={onToggleSave} className="flex flex-col items-center gap-1">
          <BookmarkIcon
            className={`h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${saved ? "text-primary" : "text-white"}`}
            filled={saved}
          />
          <span className="text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">
            {fakeCount(product.id + "s", 10, 120) + (saved ? 1 : 0)}
          </span>
        </button>

        <button type="button" aria-label="Share" onClick={onShare} className="flex items-center justify-center">
          <ShareIcon className="h-8 w-8 text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)]" />
        </button>

        <button
          type="button"
          aria-label={qty > 0 ? "Edit bag quantity" : "Add to bag"}
          onClick={onOpenBag}
          className="flex flex-col items-center gap-1"
        >
          <CartIcon
            className={`h-8 w-8 drop-shadow-[0_2px_6px_rgba(0,0,0,0.55)] ${qty > 0 ? "text-primary" : "text-white"}`}
          />
          {qty > 0 && (
            <span className="text-[12px] font-bold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.6)]">{qty}</span>
          )}
        </button>
      </div>

      {/* Top-left product name + price + packing — glassy chip over the photo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 p-4 pr-24">
        <div className="inline-flex max-w-full flex-col gap-0.5 rounded-2xl border border-white/40 bg-white/25 px-3 py-2 shadow-sm backdrop-blur-md">
          <span className="truncate text-left text-[18px] font-bold leading-snug text-black">
            {product.name}
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-black">
              {formatCurrency(product.effective_price)}
            </span>
            {product.mrp > product.effective_price && (
              <span className="text-xs text-black/55 line-through">
                {formatCurrency(product.mrp)}
              </span>
            )}
          </div>
          {product.packing && (
            <span className="truncate text-xs font-medium text-black/70">
              {formatPackingLabel(product.packing)}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

export default function HomePage() {
  const products = useProducts();
  const posts = usePosts();
  const categories = useCategories();
  const { addItem, getQty, setQty } = useCart();
  const { register: registerHomeSearch } = useHomeSearch();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  // Top-bar search icon (layout) reveals this row; focus once it mounts.
  useEffect(() => {
    return registerHomeSearch(() => setIsSearchOpen(true));
  }, [registerHomeSearch]);

  useEffect(() => {
    if (isSearchOpen) searchInputRef.current?.focus();
  }, [isSearchOpen]);

  // Posts (newest first, from the API) lead the feed, followed by the
  // regular product catalog — products already referenced by a post are
  // skipped from the catalog tail so the same item doesn't show up twice.
  // Picking a category filters the whole feed down to that category; "All"
  // (selectedCategoryId === null) shows everything, capped to FEED_COUNT
  // unless a search/category narrows it down.
  const feedProducts = useMemo(() => {
    const postItems = (posts.data ?? []).map(postToFeedItem);
    const postedProductIds = new Set(postItems.map((p) => p.id));
    const catalogItems = (products.data ?? []).filter((p) => !postedProductIds.has(p.id));
    let combined = [...postItems, ...catalogItems];

    if (selectedCategoryId !== null) {
      combined = combined.filter((p) => p.category_id === selectedCategoryId);
    }

    const query = debouncedSearch.trim().toLowerCase();
    if (query) {
      combined = combined.filter((p) => p.name.toLowerCase().includes(query));
    }

    if (selectedCategoryId === null && !query) return combined.slice(0, FEED_COUNT);
    return combined;
  }, [posts.data, products.data, selectedCategoryId, debouncedSearch]);
  const openProduct = feedProducts.find((p) => p.id === openProductId) ?? null;
  const isLoading = products.isLoading || posts.isLoading;

  async function handleShare(product: ProductCatalogResponse) {
    const url = `${window.location.origin}/products/${product.id}`;
    const shareData: ShareData = {
      title: product.name,
      text: `${product.name} — ${formatCurrency(product.effective_price)}`,
      url,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(url);
      }
    } catch {
      // User cancelled the share sheet — nothing to do.
    }
  }

  return (
    <div className="relative flex h-full flex-col bg-white">
      {isSearchOpen && (
        <div className="flex shrink-0 items-center gap-2 border-b border-border bg-white px-4 py-3">
          <div className="flex h-11 flex-1 items-center gap-2 rounded-xl border border-border px-3.5">
            <SearchIcon className="h-4 w-4 shrink-0 text-ink-muted" />
            <input
              ref={searchInputRef}
              type="search"
              placeholder="Search products…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-full w-full bg-transparent text-sm text-ink placeholder:text-ink-muted/60 outline-none"
            />
          </div>

          <button
            type="button"
            aria-label="Filters"
            onClick={() => setIsFilterOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-colors hover:brightness-95"
          >
            <SettingsIcon className="h-[18px] w-[18px]" />
          </button>

          <button
            type="button"
            aria-label="Close search"
            onClick={() => {
              setIsSearchOpen(false);
              setSearch("");
            }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-surface text-ink-muted transition-colors hover:bg-border hover:text-ink"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      <FilterDrawer
        open={isFilterOpen}
        categories={categories.data ?? []}
        selectedCategoryId={selectedCategoryId}
        onApply={(id) => {
          setSelectedCategoryId(id);
          setIsFilterOpen(false);
        }}
        onClose={() => setIsFilterOpen(false)}
      />

      {isLoading && (
        <div className="flex flex-1 flex-col gap-2 p-3">
          <Skeleton className="h-full w-full" />
        </div>
      )}

      {!isLoading && feedProducts.length === 0 && (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-ink-muted">
          {search.trim() || selectedCategoryId ? "No products match your filters." : "No products to show yet."}
        </p>
      )}

      {!isLoading && feedProducts.length > 0 && (
        <div className="flex-1 snap-y snap-mandatory overflow-y-auto overscroll-y-contain">
          {feedProducts.map((product) => (
            <ReelSlide
              key={product.id}
              product={product}
              liked={!!liked[product.id]}
              saved={!!saved[product.id]}
              qty={getQty(product.id)}
              onToggleLike={() => setLiked((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
              onToggleSave={() => setSaved((prev) => ({ ...prev, [product.id]: !prev[product.id] }))}
              onShare={() => handleShare(product)}
              onOpenBag={() => setOpenProductId(product.id)}
            />
          ))}
        </div>
      )}

      {openProduct && (
        <ProductDetailSheet
          product={openProduct}
          qty={getQty(openProduct.id)}
          onClose={() => setOpenProductId(null)}
          onConfirm={(qty) => {
            if (getQty(openProduct.id) === 0) {
              addItem(openProduct, qty);
            } else {
              setQty(openProduct.id, qty);
            }
            setOpenProductId(null);
          }}
        />
      )}
    </div>
  );
}
