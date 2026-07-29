import { TruckIcon } from "@/components/customer/icons";
import { formatCurrency } from "@/lib/utils/format";

// Threshold isn't backend-driven (no such field exists on any schema yet) —
// hardcoded to match the mockup until a real delivery-rules API exists.
export const FREE_DELIVERY_THRESHOLD = 1500;

export function FreeDeliveryProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const pct = Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100);

  return (
    <div className="rounded-xl border border-primary/20 bg-primary-soft p-4">
      <div className="flex items-center gap-2 text-sm">
        <TruckIcon className="h-5 w-5 shrink-0 text-primary" />
        {remaining > 0 ? (
          <p className="text-ink">
            Add items worth <span className="font-semibold">{formatCurrency(remaining)}</span> more to get{" "}
            <span className="font-semibold text-primary">FREE DELIVERY</span>
          </p>
        ) : (
          <p className="font-semibold text-primary">You&apos;ve unlocked free delivery!</p>
        )}
      </div>
      <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
