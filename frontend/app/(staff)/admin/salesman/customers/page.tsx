"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { SalesmanTopBar } from "@/components/salesman/SalesmanTopBar";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { SearchIcon, PhoneIcon, MapPinIcon, PlusIcon } from "@/components/salesman/icons";
import { useCustomers } from "@/lib/hooks/useCustomers";
import { useCurrentUser } from "@/lib/hooks/useCurrentUser";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import { formatCurrency, isSameDate, toDateInputValue } from "@/lib/utils/format";
import type { CustomerMeResponse } from "@/types/customers";

type Tab = "all" | "mine" | "recent" | "outstanding";

const TABS: { id: Tab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "mine", label: "My Customers" },
  { id: "recent", label: "Recently Added" },
  { id: "outstanding", label: "Outstanding" },
];

export default function SalesmanCustomersPage() {
  useRoleGuard(["admin", "salesman", "manager"]);

  const router = useRouter();
  const searchParams = useSearchParams();
  const takeOrderIntent = searchParams.get("intent") === "take-order";

  const [tab, setTab] = useState<Tab>("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);

  const currentUser = useCurrentUser();
  const customers = useCustomers(200, debouncedSearch || undefined);

  const today = toDateInputValue();
  const [thirtyDaysAgoMs] = useState(() => Date.now() - 30 * 24 * 60 * 60 * 1000);

  const filtered = useMemo(() => {
    const items = customers.data?.items ?? [];
    if (tab === "mine") {
      return items.filter((c) => c.is_private && c.created_by_user_id === currentUser.data?.id);
    }
    if (tab === "recent") {
      return items
        .filter((c) => new Date(c.created_at).getTime() >= thirtyDaysAgoMs)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    if (tab === "outstanding") {
      // Outstanding balance is only fully known via /customers/{id}/dues, per
      // customer — see the Outstanding card on the Customer Details screen
      // for the exact figure. Here we approximate: anyone over their credit
      // limit's "clean" state, i.e. anything not brand-new with 0 balance,
      // isn't derivable cheaply for a whole list, so we just show every
      // customer with a positive credit_limit as a starting point.
      return items.filter((c) => c.credit_limit > 0);
    }
    return items;
  }, [customers.data, tab, currentUser.data, thirtyDaysAgoMs]);

  return (
    <div>
      <SalesmanTopBar title="Customers" subtitle={`${customers.data?.total ?? 0} total`} />

      <div className="flex flex-col gap-4 p-4 pb-28 sm:p-6">
        {takeOrderIntent && (
          <div className="rounded-lg bg-primary-soft px-3.5 py-2.5 text-sm font-medium text-ink">
            Select a customer to take an order for
          </div>
        )}

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, code…"
            className="h-11 w-full rounded-lg border border-border bg-white pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/60 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-soft"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors ${
                tab === t.id ? "bg-primary text-white" : "bg-white text-ink-muted border border-border"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3">
          {customers.isLoading &&
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}

          {!customers.isLoading && filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-ink-muted">No customers found.</p>
          )}

          {filtered.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              isNew={isSameDate(customer.created_at, today)}
              onTakeOrder={() => router.push(`/admin/salesman/take-order?customerId=${customer.id}`)}
            />
          ))}
        </div>
      </div>

      <Link
        href="/admin/salesman/customers/add"
        className="fixed inset-x-4 bottom-20 flex h-12 items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-lg sm:absolute sm:inset-x-6 sm:bottom-6"
      >
        <PlusIcon className="h-5 w-5" />
        Add Customer / Party
      </Link>
    </div>
  );
}

function CustomerCard({
  customer,
  isNew,
  onTakeOrder,
}: {
  customer: CustomerMeResponse;
  isNew: boolean;
  onTakeOrder: () => void;
}) {
  const mapsHref =
    customer.latitude && customer.longitude
      ? `https://www.google.com/maps/search/?api=1&query=${customer.latitude},${customer.longitude}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${customer.address}, ${customer.city}, ${customer.state}`
        )}`;

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-ink">{customer.business_name}</p>
            {isNew && <Badge tone="success">New</Badge>}
            {customer.is_private && <Badge tone="neutral">Private</Badge>}
          </div>
          <p className="text-xs text-ink-muted">{customer.owner_name}</p>
          <p className="mt-1 truncate text-xs text-ink-muted">
            {customer.address}, {customer.city}
          </p>
        </div>
        <Badge tone={customer.status === "active" ? "success" : customer.status === "blocked" ? "danger" : "neutral"}>
          {customer.status}
        </Badge>
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-muted">Credit Limit: {formatCurrency(customer.credit_limit)}</span>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onTakeOrder}
          className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white"
        >
          Take Order
        </button>
        <Link
          href={`/admin/salesman/customers/${customer.id}`}
          className="flex-1 rounded-lg border border-border px-3 py-2 text-center text-xs font-semibold text-ink"
        >
          View Details
        </Link>
        <a
          href={`tel:${customer.mobile}`}
          aria-label="Call"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink"
        >
          <PhoneIcon className="h-4 w-4" />
        </a>
        <a
          href={mapsHref}
          target="_blank"
          rel="noreferrer"
          aria-label="Navigate"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-ink"
        >
          <MapPinIcon className="h-4 w-4" />
        </a>
      </div>
    </Card>
  );
}
