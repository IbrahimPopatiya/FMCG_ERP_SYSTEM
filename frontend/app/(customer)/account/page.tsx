"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRightIcon } from "@/components/customer/icons";
import { clearSession } from "@/lib/auth/session";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";

interface AccountRow {
  label: string;
  description: string;
  href?: string;
}

// Only "Credit & Invoices" is backed by a real page today (the /dues page).
// The rest of this list (business/user profile edit, addresses, payment
// methods, notifications, settings, help) has no backend support yet — no
// address book, no saved payment methods, no notifications API — so they
// render disabled with a "Coming soon" tag rather than as dead links that
// promise a feature that doesn't exist.
const ACCOUNT_ROWS: AccountRow[] = [
  { label: "Business Details", description: "Manage your business information" },
  { label: "User Profile", description: "Manage personal information" },
  { label: "Delivery Addresses", description: "Manage delivery addresses" },
  { label: "Payment Methods", description: "Manage payment options" },
  { label: "Credit & Invoices", description: "View bills and credit history", href: "/dues" },
  { label: "Notifications", description: "Manage your notifications" },
  { label: "Settings", description: "App preferences and settings" },
  { label: "Help & Support", description: "Get help and support" },
];

export default function AccountPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const customer = useCurrentCustomer();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">My Profile</h1>
      </header>

      {customer.isLoading && (
        <div className="flex flex-col gap-3 p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      )}

      {customer.isError && (
        <div className="p-4">
          <div className="rounded-lg bg-danger-soft px-3.5 py-2.5 text-sm font-medium text-danger">
            Couldn&apos;t load your account details.
          </div>
        </div>
      )}

      {customer.data && (
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-4 pb-8 md:p-8">
          <div className="flex items-center gap-4 rounded-2xl border border-border bg-white p-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary-soft text-lg font-semibold text-primary">
              {customer.data.business_name.charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-base font-semibold text-ink">{customer.data.business_name}</p>
              <p className="mt-0.5 text-sm text-ink-muted">{customer.data.mobile}</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {customer.data.address}, {customer.data.city}, {customer.data.state} {customer.data.pincode}
              </p>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">My Account</h2>
            <div className="divide-y divide-border rounded-xl border border-border bg-white">
              {ACCOUNT_ROWS.map((row) =>
                row.href ? (
                  <Link
                    key={row.label}
                    href={row.href}
                    className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-surface"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{row.label}</p>
                      <p className="text-xs text-ink-muted">{row.description}</p>
                    </div>
                    <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-muted" />
                  </Link>
                ) : (
                  <div key={row.label} className="flex items-center justify-between gap-3 px-4 py-3.5">
                    <div>
                      <p className="text-sm font-medium text-ink-muted">{row.label}</p>
                      <p className="text-xs text-ink-muted/70">{row.description}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium text-ink-muted">
                      Coming soon
                    </span>
                  </div>
                )
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-semibold text-danger hover:opacity-90"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
