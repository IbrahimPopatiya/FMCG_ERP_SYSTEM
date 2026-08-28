"use client";

import { useState } from "react";
import {
  CloseIcon,
  TagIcon,
  BoxIcon,
  SettingsIcon,
  CategoryAllIcon,
  ChevronDownIcon,
  CheckIcon,
  RefreshIcon,
  RupeeIcon,
} from "@/components/customer/icons";
import type { CategoryResponse } from "@/types/categories";
import type { BrandResponse } from "@/types/brands";

// Placeholder options until brand-chip and price-range filtering are wired
// up to the real API — selectable in the UI now, but don't affect the feed
// yet. Only shown in "category" mode (customer Home); salesman Home's
// "brand" mode drops both sections in favor of a real, feed-wired brand list.
const DUMMY_BRANDS = ["Amul", "Nestlé", "Britannia", "ITC", "Parle", "Haldiram's"];
const DUMMY_PRICE_RANGES = ["Under ₹100", "₹100 – ₹500", "₹500 – ₹1000", "Above ₹1000"];

// A collapsible section header: icon chip + bold label + expand/collapse chevron.
function FilterSectionHeader({
  icon,
  label,
  expanded,
  onToggle,
}: {
  icon: React.ReactNode;
  label: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center gap-2.5 py-2 text-left"
      aria-expanded={expanded}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
        {icon}
      </span>
      <span className="flex-1 text-base font-bold text-ink">{label}</span>
      <ChevronDownIcon
        className={`h-4 w-4 text-ink-muted transition-transform ${expanded ? "rotate-180" : ""}`}
      />
    </button>
  );
}

// Slide-in filter panel (from the left), opened via a header's filter icon.
// Selections are staged locally and only take effect on "Apply Filters".
//
// Two modes:
// - "category" (default, customer Home): Category list wired to the real
//   feed; Brand chips and Price Range are placeholder sections, selectable
//   in the UI but not wired to the feed until the backend supports them.
// - "brand" (salesman Home): the Category/Brand-chips/Price-Range sections
//   are replaced by a single real Brand list (same list layout as
//   Categories), wired to the feed via brand_id.
export function FilterDrawer({
  open,
  mode = "category",
  categories,
  selectedCategoryId,
  brands,
  selectedBrandId,
  onApply,
  onClose,
}: {
  open: boolean;
  mode?: "category" | "brand";
  categories?: CategoryResponse[];
  selectedCategoryId?: string | null;
  brands?: BrandResponse[];
  selectedBrandId?: string | null;
  onApply: (id: string | null) => void;
  onClose: () => void;
}) {
  const selectedId = mode === "brand" ? selectedBrandId ?? null : selectedCategoryId ?? null;
  const [draftId, setDraftId] = useState(selectedId);
  const [selectedBrand, setSelectedBrand] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [categoriesExpanded, setCategoriesExpanded] = useState(true);
  const [brandsExpanded, setBrandsExpanded] = useState(true);
  const [priceExpanded, setPriceExpanded] = useState(true);

  // Reopening the panel should reflect whatever filter is actually applied,
  // not a stale draft left over from last time it was dismissed unapplied.
  // Adjusted during render (not an effect) per React's "adjusting state when
  // a prop changes" pattern, so it takes effect before the re-open paints.
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) setDraftId(selectedId);
  }

  function handleClearAll() {
    setDraftId(null);
    setSelectedBrand(null);
    setSelectedPriceRange(null);
  }

  return (
    <div className={`fixed inset-0 z-40 ${open ? "" : "pointer-events-none"}`}>
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col rounded-r-3xl bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-border px-5 py-5">
          <p className="text-2xl font-extrabold tracking-tight text-ink">Filters</p>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-soft text-primary hover:brightness-95"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5">
          {mode === "brand" ? (
            <>
              <div className="border-b border-border py-1">
                <FilterSectionHeader
                  icon={<TagIcon className="h-4 w-4" />}
                  label="Brand"
                  expanded={categoriesExpanded}
                  onToggle={() => setCategoriesExpanded((v) => !v)}
                />
              </div>

              {categoriesExpanded && (
                <div className="flex flex-col py-1">
                  <button
                    type="button"
                    onClick={() => setDraftId(null)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-semibold transition-colors ${
                      draftId === null ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface"
                    }`}
                  >
                    <TagIcon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">All Brands</span>
                    {draftId === null && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>

                  {(brands ?? []).map((brand, index) => {
                    const active = draftId === brand.id;
                    return (
                      <button
                        key={brand.id}
                        type="button"
                        onClick={() => setDraftId(brand.id)}
                        className={`flex items-center gap-3 px-3 py-3 text-left text-[15px] font-medium transition-colors ${
                          active ? "rounded-xl bg-primary-soft text-primary" : "text-ink hover:bg-surface"
                        } ${!active && index < (brands?.length ?? 0) - 1 ? "border-b border-border/70" : ""}`}
                      >
                        {brand.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={brand.logo}
                            alt=""
                            className="h-[18px] w-[18px] shrink-0 rounded object-cover"
                          />
                        ) : (
                          <BoxIcon className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
                        )}
                        <span className="flex-1">{brand.name}</span>
                        {active && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <CheckIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="border-b border-border py-1">
                <FilterSectionHeader
                  icon={<CategoryAllIcon className="h-4 w-4" />}
                  label="Categories"
                  expanded={categoriesExpanded}
                  onToggle={() => setCategoriesExpanded((v) => !v)}
                />
              </div>

              {categoriesExpanded && (
                <div className="flex flex-col py-1">
                  <button
                    type="button"
                    onClick={() => setDraftId(null)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-3 text-left text-[15px] font-semibold transition-colors ${
                      draftId === null ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface"
                    }`}
                  >
                    <CategoryAllIcon className="h-[18px] w-[18px] shrink-0" />
                    <span className="flex-1">All Categories</span>
                    {draftId === null && (
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                        <CheckIcon className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </button>

                  {(categories ?? []).map((category, index) => {
                    const active = draftId === category.id;
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => setDraftId(category.id)}
                        className={`flex items-center gap-3 px-3 py-3 text-left text-[15px] font-medium transition-colors ${
                          active ? "rounded-xl bg-primary-soft text-primary" : "text-ink hover:bg-surface"
                        } ${!active && index < (categories?.length ?? 0) - 1 ? "border-b border-border/70" : ""}`}
                      >
                        {category.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={category.image}
                            alt=""
                            className="h-[18px] w-[18px] shrink-0 rounded object-cover"
                          />
                        ) : (
                          <BoxIcon className="h-[18px] w-[18px] shrink-0 text-ink-muted" />
                        )}
                        <span className="flex-1">{category.name}</span>
                        {active && (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-white">
                            <CheckIcon className="h-3.5 w-3.5" />
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="border-b border-border py-1">
                <FilterSectionHeader
                  icon={<TagIcon className="h-4 w-4" />}
                  label="Brands"
                  expanded={brandsExpanded}
                  onToggle={() => setBrandsExpanded((v) => !v)}
                />
              </div>

              {brandsExpanded && (
                <div className="flex flex-wrap gap-2 py-3">
                  {DUMMY_BRANDS.map((brand) => (
                    <button
                      key={brand}
                      type="button"
                      onClick={() => setSelectedBrand((prev) => (prev === brand ? null : brand))}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        selectedBrand === brand
                          ? "border-primary bg-primary text-white"
                          : "border-border text-ink-muted hover:bg-surface"
                      }`}
                    >
                      {brand}
                    </button>
                  ))}
                </div>
              )}

              <div className="border-b border-border py-1">
                <FilterSectionHeader
                  icon={<RupeeIcon className="h-4 w-4" />}
                  label="Price Range"
                  expanded={priceExpanded}
                  onToggle={() => setPriceExpanded((v) => !v)}
                />
              </div>

              {priceExpanded && (
                <div className="flex flex-wrap gap-2 py-3">
                  {DUMMY_PRICE_RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setSelectedPriceRange((prev) => (prev === range ? null : range))}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                        selectedPriceRange === range
                          ? "border-primary bg-primary text-white"
                          : "border-border text-ink-muted hover:bg-surface"
                      }`}
                    >
                      {range}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}

          <div className="h-4" />
        </div>

        <div
          className="flex shrink-0 flex-col items-center gap-3 border-t border-border px-5 py-4"
          style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
        >
          <button
            type="button"
            onClick={() => onApply(draftId)}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-white transition-colors hover:bg-primary-hover"
          >
            <SettingsIcon className="h-4 w-4" />
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
