"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearSession } from "@/lib/auth/session";
import { useCurrentUser } from "@/lib/hooks/useUsers";
import { BackArrowIcon, BellIcon } from "@/components/admin/icons";

interface TopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
}

export function TopBar({ title, subtitle, backHref, onBack }: TopBarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  function handleBack() {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    router.back();
  }

  return (
    <header className="flex items-center justify-between gap-3 border-b border-border bg-white px-4 py-3.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        {(backHref || onBack) ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink transition-colors hover:bg-surface"
            aria-label="Go back"
          >
            <BackArrowIcon className="h-5 w-5" />
          </button>
        ) : null}
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight text-ink">{title}</h1>
          {subtitle && <p className="truncate text-sm text-ink-muted">{subtitle}</p>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden h-5 w-24 items-center gap-1.5 text-sm font-medium text-ink-muted sm:flex">
          {currentUser.data ? (
            currentUser.data.full_name
          ) : (
            <span className="h-3.5 w-full animate-pulse rounded bg-surface" />
          )}
        </span>
        <button
          type="button"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
        >
          Logout
        </button>
      </div>
    </header>
  );
}
