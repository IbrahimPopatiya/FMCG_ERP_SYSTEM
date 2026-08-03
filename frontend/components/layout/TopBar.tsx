"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { BackArrowIcon } from "@/components/admin/icons";
import { AccountIcon } from "@/components/customer/icons";
import { AdminMenuButton } from "@/components/layout/AdminMenu";
import { Logo } from "@/components/ui/Logo";
import { BRAND } from "@/lib/branding";

interface TopBarProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  onBack?: () => void;
}

function ProfileMenu() {
  return (
    <Link
      href="/admin/profile"
      aria-label="Profile"
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary transition-colors hover:brightness-95"
    >
      <AccountIcon className="h-5 w-5" />
    </Link>
  );
}

// Brand app bar shown at the top of every admin/staff screen — hamburger
// (or back arrow on detail/create screens) on the left, the brand name in
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

      <h1 className="flex min-w-0 items-center justify-center gap-2 truncate text-lg font-bold tracking-tight text-ink">
        <Logo className="h-7 w-auto" />
        {!BRAND.logoIncludesName && BRAND.name}
      </h1>

      <div className="flex shrink-0 items-center gap-2">
        <ProfileMenu />
      </div>
    </header>
  );
}
