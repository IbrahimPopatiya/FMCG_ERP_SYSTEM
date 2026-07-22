"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/Skeleton";
import { ChevronRightIcon, OrdersIcon, AccountIcon } from "@/components/customer/icons";
import { clearSession } from "@/lib/auth/session";
import { useCurrentCustomer } from "@/lib/hooks/useCurrentCustomer";
import { useCustomerDues } from "@/lib/hooks/useCustomerDues";
import { formatCurrency } from "@/lib/utils/format";

interface AccountRow {
  label: string;
  description: string;
  href?: string;
}

// Only "Credit & Invoices" is backed by a real page today (the /dues page).
// The rest of the mockup's list (business/user profile edit, addresses,
// payment methods, notifications, settings, help) has no backend support
// yet — no address book, no saved payment methods, no notifications API —
// so they render disabled with a "Coming soon" tag rather than as dead links
// that promise a feature that doesn't exist.
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
  const dues = useCustomerDues();

  function handleLogout() {
    clearSession();
    queryClient.clear();
    router.push("/login");
  }

  const creditLimit = customer.data?.credit_limit ?? 0;
  const outstanding = dues.data?.total_due ?? 0;
  const available = Math.max(0, creditLimit - outstanding);
  const usedPct = creditLimit > 0 ? Math.min(100, (available / creditLimit) * 100) : 0;

  return (
    <div className="flex flex-col">
      <header className="sticky top-0 z-10 border-b border-border bg-white px-4 py-3 md:px-8">
        <h1 className="text-lg font-semibold tracking-tight text-ink">My Profile</h1>
      </header>

      {(customer.isLoading || dues.isLoading) && (
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
          <div className="overflow-hidden rounded-2xl bg-primary text-white">
            <div className="flex items-center gap-4 p-5">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white/20 text-lg font-semibold">
                {customer.data.business_name.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold">{customer.data.business_name}</p>
                {customer.data.status === "active" && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs font-medium text-white/90">
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/25">✓</span>
                    Verified Business
                  </p>
                )}
                <p className="mt-1 truncate text-xs text-white/80">
                  {customer.data.address}, {customer.data.city}, {customer.data.state}
                </p>
              </div>
            </div>

            <div className="-mt-1 rounded-t-2xl bg-white p-5 text-ink">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-xs text-ink-muted">Credit Limit</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{formatCurrency(creditLimit)}</p>
                </div>
                <div className="border-x border-border">
                  <p className="text-xs text-ink-muted">Available Credit</p>
                  <p className="mt-1 text-sm font-semibold text-primary">{formatCurrency(available)}</p>
                </div>
                <div>
                  <p className="text-xs text-ink-muted">Outstanding</p>
                  <p className="mt-1 text-sm font-semibold text-danger">{formatCurrency(outstanding)}</p>
                </div>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-surface">
                <div className="h-full rounded-full bg-primary" style={{ width: `${usedPct}%` }} />
              </div>
              <Link
                href="/dues"
                className="mt-3 flex items-center justify-center gap-1 text-sm font-medium text-primary hover:text-primary-hover"
              >
                View Credit Details
                <ChevronRightIcon className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div>
            <h2 className="mb-2 text-sm font-semibold text-ink">Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Link
                href="/orders"
                className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4 text-center hover:bg-primary-soft"
              >
                <OrdersIcon className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-ink">My Orders</span>
              </Link>
              <Link
                href="/dues"
                className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4 text-center hover:bg-primary-soft"
              >
                <ChevronRightIcon className="h-5 w-5 rotate-90 text-primary" />
                <span className="text-xs font-medium text-ink">Invoices</span>
              </Link>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4 text-center opacity-50">
                <AccountIcon className="h-5 w-5 text-ink-muted" />
                <span className="text-xs font-medium text-ink-muted">Addresses</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-4 text-center opacity-50">
                <AccountIcon className="h-5 w-5 text-ink-muted" />
                <span className="text-xs font-medium text-ink-muted">Payments</span>
              </div>
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

          <div className="divide-y divide-border rounded-xl border border-border bg-white text-sm">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-ink-muted">Customer code</span>
              <span className="font-medium text-ink">{customer.data.customer_code}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-ink-muted">Mobile</span>
              <span className="font-medium text-ink">{customer.data.mobile}</span>
            </div>
            {customer.data.gst_number && (
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-ink-muted">GST number</span>
                <span className="font-medium text-ink">{customer.data.gst_number}</span>
              </div>
            )}
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-ink-muted">Payment terms</span>
              <span className="font-medium text-ink">{customer.data.payment_terms} days</span>
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
