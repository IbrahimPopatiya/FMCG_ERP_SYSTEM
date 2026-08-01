"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { clearSession } from "@/lib/auth/session";
import { useCurrentUser } from "@/lib/hooks/useUsers";
import { BackArrowIcon } from "@/components/admin/icons";
import { AccountIcon, LogoutIcon } from "@/components/customer/icons";
import { AdminMenuButton } from "@/components/layout/AdminMenu";

interface TopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
}

function ProfileMenu() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label="Profile"
        aria-expanded={open}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:brightness-95"
      >
        <AccountIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-20 w-56 overflow-hidden rounded-xl border border-border bg-white shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-ink">
              {currentUser.data ? currentUser.data.full_name : "—"}
            </p>
            {currentUser.data?.role && (
              <p className="truncate text-xs capitalize text-ink-muted">{currentUser.data.role}</p>
            )}
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-ink-muted transition-colors hover:bg-surface hover:text-ink"
          >
            <LogoutIcon className="h-4 w-4" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

// Brand app bar shown at the top of every admin/staff screen — hamburger
// (or back arrow on detail/create screens) on the left, "Zaid Traders" in
// the center, notifications + profile on the right. Per-page titles used to
// live here; they're redundant now since every screen already carries its
// own in-content header below this bar.
export function TopBar({ backHref, onBack }: TopBarProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) return onBack();
    if (backHref) return router.push(backHref);
    router.back();
  }

  return (
    <header
      className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-border/70 bg-white/80 px-4 pb-3.5 pt-5 pb-5 backdrop-blur-xl sm:px-6"
      style={{ paddingTop: "calc(1.25rem + env(safe-area-inset-top))" }}
    >
      <div className="flex w-9 shrink-0 items-center">
        {backHref || onBack ? (
          <button
            type="button"
            onClick={handleBack}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-surface text-ink transition-colors hover:bg-border"
            aria-label="Go back"
          >
            <BackArrowIcon className="h-5 w-5" />
          </button>
        ) : (
          <AdminMenuButton className="bg-surface hover:bg-border" />
        )}
      </div>

      <h1 className="truncate text-lg font-bold tracking-tight text-ink">Zaid Traders</h1>

      <div className="flex shrink-0 items-center gap-2">
        <ProfileMenu />
      </div>
    </header>
  );
}
