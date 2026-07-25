"use client";

import { useRouter } from "next/navigation";

// Deep green app bar used on every screen in final_docs/images/admin design
// workflow.png (screen1-4/5-8/9-12/13-15/16-17.png) — mirrors
// components/salesman/SalesmanTopBar.tsx so admin and salesman share one
// pattern on the same green theme.
interface AdminTopBarProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: React.ReactNode;
}

export function AdminTopBar({ title, subtitle, back = false, right }: AdminTopBarProps) {
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
            {subtitle && <p className="text-xs text-white/75">{subtitle}</p>}
          </div>
        </div>
        {right && <div className="flex shrink-0 items-center gap-1">{right}</div>}
      </div>
    </header>
  );
}

export function AdminIconButton({
  onClick,
  label,
  children,
}: {
  onClick?: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white/90 hover:bg-white/10"
    >
      {children}
    </button>
  );
}
