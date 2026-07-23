"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BellIcon } from "@/components/cashier/icons";

const TODAY_LABEL = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
}).format(new Date());

interface CashierTopBarProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  hideAlerts?: boolean;
}

export function CashierTopBar({ title, subtitle, back = false, hideAlerts = false }: CashierTopBarProps) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-10 bg-primary px-4 py-4 text-white sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          {back && (
            <button
              type="button"
              onClick={() => router.back()}
              aria-label="Go back"
              className="-ml-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
            >
              ←
            </button>
          )}
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold tracking-tight">{title}</h1>
            <p className="text-xs text-white/75">{subtitle ?? TODAY_LABEL}</p>
          </div>
        </div>
        {!hideAlerts && (
          <Link
            href="/admin/cashier/alerts"
            aria-label="Alerts"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
          >
            <BellIcon className="h-5 w-5" />
          </Link>
        )}
      </div>
    </header>
  );
}
