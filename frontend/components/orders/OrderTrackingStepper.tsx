import type { OrderStatus } from "@/types/salesOrder";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Placed" },
  { status: "approved", label: "Approved" },
  { status: "loaded", label: "Loaded" },
  { status: "delivered", label: "Delivered" },
];

const STEP_INDEX: Record<OrderStatus, number> = {
  pending: 0,
  approved: 1,
  loaded: 2,
  delivered: 3,
  cancelled: -1,
};

export function OrderTrackingStepper({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
        <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
        <p className="text-sm font-medium text-red-700">This order was cancelled</p>
      </div>
    );
  }

  const currentIndex = STEP_INDEX[status];

  return (
    <div className="flex items-start rounded-xl border border-border bg-white p-4">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={step.status} className={`flex flex-1 flex-col items-center ${isLast ? "flex-none" : ""}`}>
            <div className="flex w-full items-center">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold ${
                  done ? "bg-primary text-white" : "bg-surface text-ink-muted"
                }`}
              >
                {done ? "✓" : i + 1}
              </span>
              {!isLast && (
                <span className={`mx-1 h-0.5 flex-1 ${i < currentIndex ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
            <p className={`mt-1.5 text-center text-[11px] font-medium ${done ? "text-ink" : "text-ink-muted"}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}
