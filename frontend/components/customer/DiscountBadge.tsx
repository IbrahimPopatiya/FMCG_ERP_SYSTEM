export function discountPercent(mrp: number, effectivePrice: number): number {
  if (mrp <= 0 || effectivePrice >= mrp) return 0;
  return Math.round((1 - effectivePrice / mrp) * 100);
}

export function DiscountBadge({ mrp, effectivePrice }: { mrp: number; effectivePrice: number }) {
  const pct = discountPercent(mrp, effectivePrice);
  if (pct <= 0) return null;
  return (
    <span className="inline-flex items-center rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-bold text-white">
      {pct}% OFF
    </span>
  );
}
