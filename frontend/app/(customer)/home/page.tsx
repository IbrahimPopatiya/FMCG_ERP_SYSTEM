"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { QtyStepper } from "@/components/ui/QtyStepper";
import {
  BellIcon,
  CartIcon,
  HeartIcon,
  BookmarkIcon,
  ShareIcon,
  BackArrowIcon,
  CategoryAllIcon,
  CloseIcon,
  TagIcon,
  SparkleIcon,
  BoxIcon,
} from "@/components/customer/icons";
import { useCart } from "@/components/cart/CartProvider";
import { useProducts } from "@/lib/hooks/useProducts";
import { usePosts } from "@/lib/hooks/usePosts";
import { useCategories } from "@/lib/hooks/useCategories";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { formatCurrency } from "@/lib/utils/format";
import { dummyProductImage } from "@/lib/utils/dummyProductImage";
import type { ProductCatalogResponse } from "@/types/product";
import type { PostResponse } from "@/types/post";
import type { CategoryResponse } from "@/types/categories";

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
    mrp: post.mrp,
    effective_price: post.price,
    gst_rate: 0,
    image: post.image,
  };
}

const FEED_COUNT = 8;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
}

function CategoryBar({
  categories,
  selectedId,
  onSelect,
}: {
  categories: CategoryResponse[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto px-4 pb-3 pt-1 scrollbar-none">
      <button
        type="button"
        onClick={() => onSelect(null)}
        className="flex shrink-0 flex-col items-center gap-1.5"
      >
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-full bg-white text-ink transition-all ${
            selectedId === null ? "ring-2 ring-[#d12626] ring-offset-2 ring-offset-ink" : ""
          }`}
        >
          <CategoryAllIcon className="h-5 w-5" />
        </span>
        <span className={`text-xs font-medium ${selectedId === null ? "text-[#d12626]" : "text-white/70"}`}>
          All
        </span>
      </button>

      {categories.map((category) => {
        const active = selectedId === category.id;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelect(category.id)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <span
              className={`flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white text-ink transition-all ${
                active ? "ring-2 ring-[#d12626] ring-offset-2 ring-offset-ink" : ""
              }`}
            >
              {category.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={category.image} alt={category.name} className="h-full w-full object-cover" />
              ) : (
                <span className="text-sm font-bold">{initials(category.name)}</span>
              )}
            </span>
            <span className={`max-w-[64px] truncate text-xs font-medium ${active ? "text-[#d12626]" : "text-white/70"}`}>
              {category.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Deterministic pseudo-counts so the same product always shows the same
// like/save numbers across renders, without needing real backend fields.
function fakeCount(seed: string, base: number, spread: number): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return base + (hash % spread);
}

function RailButton({
  active,
  onClick,
  children,
  label,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={`flex h-11 w-11 items-center justify-center rounded-full backdrop-blur-sm transition-colors ${
        active ? "bg-primary text-white" : "bg-black/35 text-white hover:bg-black/50"
      }`}
    >
      {children}
    </button>
  );
}

// Product detail bottom sheet, opened by tapping the product name or the
// reel image — mirrors a native "slide up from the bottom" product card.
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

  return (
    <div className="absolute inset-0 z-20 flex flex-col justify-end">
      <button
        type="button"
        aria-label="Close product details"
        onClick={onClose}
        className="absolute inset-0"
      />

      <div className="relative flex max-h-[70%] flex-col rounded-t-3xl bg-white p-5 pb-6 shadow-2xl">
        <div className="mx-auto mb-1 h-1 w-10 shrink-0 rounded-full bg-border" />
        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-surface text-ink-muted hover:bg-border"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        <div className="mt-3 flex gap-4 overflow-y-auto">
          <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary-soft">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={product.image || dummyProductImage(product.name, product.id)}
              alt={product.name}
              className="h-full w-full object-cover"
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
            className="flex h-12 w-full items-center justify-center rounded-xl bg-[#d12626] text-sm font-semibold text-white transition-colors hover:bg-red-700"
          >
            Confirm
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
  onBack,
}: {
  product: ProductCatalogResponse;
  liked: boolean;
  saved: boolean;
  qty: number;
  onToggleLike: () => void;
  onToggleSave: () => void;
  onShare: () => void;
  onOpenBag: () => void;
  onBack: () => void;
}) {
  return (
    <section className="relative h-full w-full shrink-0 snap-start snap-always overflow-hidden bg-ink">
      <div className="absolute inset-0 h-full w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image || dummyProductImage(product.name, product.id)}
          alt={product.name}
          className="h-full w-full object-contain"
        />
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />

      <button
        type="button"
        aria-label="Back"
        onClick={onBack}
        className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/35 text-white backdrop-blur-sm hover:bg-black/50"
      >
        <BackArrowIcon className="h-4 w-4" />
      </button>

      {/* Right action rail */}
      <div className="absolute bottom-24 right-3 flex flex-col items-end gap-5">
        {/* Like Card */}
        <button
          type="button"
          aria-label="Like"
          onClick={onToggleLike}
          className={`flex h-[72px] w-[50px] flex-col items-center justify-between py-2 rounded-2xl border backdrop-blur-md transition-all ${
            liked
              ? "bg-[#d12626]/80 border-[#d12626] text-white"
              : "bg-black/35 border-white/10 text-white hover:bg-black/50"
          }`}
        >
          <HeartIcon className="h-5 w-5 mt-1" filled={liked} />
          <span className="text-[10px] font-semibold mb-0.5">
            {fakeCount(product.id, 40, 260) + (liked ? 1 : 0)}
          </span>
        </button>

        {/* Save Card */}
        <button
          type="button"
          aria-label="Save"
          onClick={onToggleSave}
          className={`flex h-[72px] w-[50px] flex-col items-center justify-between py-2 rounded-2xl border backdrop-blur-md transition-all ${
            saved
              ? "bg-[#d12626]/80 border-[#d12626] text-white"
              : "bg-black/35 border-white/10 text-white hover:bg-black/50"
          }`}
        >
          <BookmarkIcon className="h-5 w-5 mt-1" filled={saved} />
          <span className="text-[10px] font-semibold mb-0.5">
            {fakeCount(product.id + "s", 10, 120) + (saved ? 1 : 0)}
          </span>
        </button>

        {/* Share Card */}
        <button
          type="button"
          aria-label="Share"
          onClick={onShare}
          className="flex h-[72px] w-[50px] flex-col items-center justify-between py-2 rounded-2xl border border-white/10 bg-black/35 text-white backdrop-blur-md transition-all hover:bg-black/50"
        >
          <ShareIcon className="h-5 w-5 mt-1" />
          <span className="text-[10px] font-semibold mb-0.5">Share</span>
        </button>

        <button
          type="button"
          aria-label={qty > 0 ? "Edit bag quantity" : "Add to bag"}
          onClick={onOpenBag}
          className={`flex h-[72px] w-[50px] flex-col items-center justify-between py-2 rounded-2xl border backdrop-blur-md transition-all ${
            qty > 0
              ? "bg-[#d12626]/80 border-[#d12626] text-white"
              : "border-white/10 bg-black/35 text-white hover:bg-black/50"
          }`}
        >
          <CartIcon className="h-5 w-5 mt-1" />
          <span className="text-[10px] font-semibold mb-0.5">{qty > 0 ? qty : "Add"}</span>
        </button>
      </div>

      {/* Bottom-left product name */}
      <div className="absolute inset-x-0 bottom-0 p-4 pr-24 pointer-events-none">
        <span className="truncate block text-left text-[20px] font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
          {product.name}
        </span>
      </div>
    </section>
  );
}

export default function HomePage() {
  const router = useRouter();
  const products = useProducts();
  const posts = usePosts();
  const categories = useCategories();
  const currentCustomer = useCurrentCustomer();
  const { addItem, getQty, setQty } = useCart();
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [openProductId, setOpenProductId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // Posts (newest first, from the API) lead the feed, followed by the
  // regular product catalog — products already referenced by a post are
  // skipped from the catalog tail so the same item doesn't show up twice.
  // Picking a category filters the whole feed down to that category; "All"
  // (selectedCategoryId === null) shows everything, capped to FEED_COUNT.
  const feedProducts = useMemo(() => {
    const postItems = (posts.data ?? []).map(postToFeedItem);
    const postedProductIds = new Set(postItems.map((p) => p.id));
    const catalogItems = (products.data ?? []).filter((p) => !postedProductIds.has(p.id));
    const combined = [...postItems, ...catalogItems];

    if (selectedCategoryId === null) return combined.slice(0, FEED_COUNT);
    return combined.filter((p) => p.category_id === selectedCategoryId);
  }, [posts.data, products.data, selectedCategoryId]);
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

  const businessName = currentCustomer.data?.business_name ?? "";

  return (
    <div className="relative flex h-full flex-col bg-ink">
      <div className="shrink-0 border-b border-white/5 bg-ink pt-3">
        <div className="flex items-center justify-between px-4 pb-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
              {businessName ? initials(businessName) : ""}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{businessName || "Welcome"}</p>
              <p className="truncate text-xs text-white/50">Wholesale &amp; Distribution</p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-white"
          >
            <BellIcon className="h-4.5 w-4.5" />
          </button>
        </div>

        <CategoryBar
          categories={categories.data ?? []}
          selectedId={selectedCategoryId}
          onSelect={setSelectedCategoryId}
        />
      </div>

      {isLoading && (
        <div className="flex flex-1 flex-col gap-2 p-3">
          <Skeleton className="h-full w-full" />
        </div>
      )}

      {!isLoading && feedProducts.length === 0 && (
        <p className="flex flex-1 items-center justify-center px-4 text-center text-sm text-white/60">
          {selectedCategoryId ? "No products in this category yet." : "No products to show yet."}
        </p>
      )}

      {!isLoading && feedProducts.length > 0 && (
        <div className="flex-1 snap-y snap-mandatory overflow-y-auto scroll-smooth">
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
              onBack={() => router.back()}
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
