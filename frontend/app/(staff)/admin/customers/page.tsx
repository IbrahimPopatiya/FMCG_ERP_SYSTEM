"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { CustomerForm } from "@/components/customers/CustomerForm";
import { CustomerStatusBadge } from "@/components/customers/CustomerStatusBadge";
import { SearchIcon, PlusIcon } from "@/components/admin/icons";
import { useCreateCustomer } from "@/lib/hooks/useCustomerMutations";
import { useCustomersManage } from "@/lib/hooks/useCustomersManage";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency } from "@/lib/utils/format";
import type { CustomerListItem, CustomerStatus } from "@/types/customers";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

const AVATAR_TONES = [
  "bg-blue-100 text-blue-700",
  "bg-green-100 text-green-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-pink-100 text-pink-700",
];

function avatarTone(seed: string) {
  const hash = seed.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}

function SkeletonRows() {
  return (
    <div className="flex flex-col gap-3 p-4 sm:p-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}

function EmptyState({ onAdd, hasSearch }: { onAdd: () => void; hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm10 3v6m-3-3h6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">
        {hasSearch ? "No customers match your search" : "No customers yet"}
      </h2>
      {!hasSearch && (
        <>
          <p className="max-w-sm text-sm text-ink-muted">
            Add the shops and retailers who order from you so they can browse the catalog and place orders.
          </p>
          <Button type="button" className="mt-1" onClick={onAdd}>
            Add customer
          </Button>
        </>
      )}
    </div>
  );
}

type TabValue = "all" | Extract<CustomerStatus, "active" | "inactive">;

export default function AdminCustomersPage() {
  useRoleGuard(["admin", "salesman", "manager", "cashier"]);

  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<TabValue>("all");
  const [isFormOpen, setFormOpen] = useState(false);
  const {
    data,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCustomersManage(search);
  const createCustomer = useCreateCustomer();

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const allCustomers = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const counts = useMemo(
    () => ({
      all: allCustomers.length,
      active: allCustomers.filter((c) => c.status === "active").length,
      inactive: allCustomers.filter((c) => c.status !== "active").length,
    }),
    [allCustomers]
  );

  const customers = allCustomers.filter((c) => {
    if (tab === "all") return true;
    if (tab === "active") return c.status === "active";
    return c.status !== "active";
  });

  return (
    <div>
      <TopBar title="Customers" subtitle="Manage All Customers" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Customers</h1>
            <p className="mt-0.5 text-sm text-ink-muted">
              {total > 0 ? `${total} customer${total === 1 ? "" : "s"}` : "Shops and retailers you sell to"}
            </p>
          </div>
          <Button
            type="button"
            className="w-full gap-1.5 rounded-full sm:w-auto"
            onClick={() => setFormOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add Customer
          </Button>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full max-w-sm rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>

        <div className="flex gap-5 border-b border-border">
          {(
            [
              { value: "all", label: `All (${counts.all})` },
              { value: "active", label: `Active (${counts.active})` },
              { value: "inactive", label: `Inactive (${counts.inactive})` },
            ] as { value: TabValue; label: string }[]
          ).map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`relative pb-2.5 text-sm font-medium transition-colors ${
                tab === t.value ? "text-primary" : "text-ink-muted hover:text-ink"
              }`}
            >
              {t.label}
              {tab === t.value && <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>
      </header>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load customers.
            <Button type="button" variant="secondary" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!isLoading && !isError && customers.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} hasSearch={!!search} />
      )}

      {!isLoading && !isError && customers.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
              <Table<CustomerListItem>
                rowKey={(c) => c.id}
                rows={customers}
                columns={[
                  {
                    header: "Business",
                    render: (c) => (
                      <Link href={`/admin/customers/${c.id}`} className="font-medium text-ink hover:text-primary">
                        {c.business_name}
                        <div className="font-mono text-xs font-normal text-ink-muted">{c.customer_code}</div>
                      </Link>
                    ),
                  },
                  { header: "Owner", render: (c) => c.owner_name },
                  { header: "Mobile", render: (c) => c.mobile },
                  { header: "City", render: (c) => `${c.city}, ${c.state}` },
                  { header: "Credit limit", render: (c) => formatCurrency(c.credit_limit) },
                  { header: "Status", render: (c) => <CustomerStatusBadge status={c.status} /> },
                ]}
              />
            </div>
          </div>

          {/* Mobile: avatar-initial rows matching the mockup */}
          <div className="flex flex-col gap-3 sm:hidden">
            {customers.map((c) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`}>
                <Card className="flex items-center gap-3 rounded-2xl">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-base font-semibold ${avatarTone(
                      c.id
                    )}`}
                  >
                    {c.business_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">{c.business_name}</p>
                    <p className="mt-0.5 truncate text-sm text-ink-muted">
                      {c.mobile} · {c.city}
                    </p>
                  </div>
                  <CustomerStatusBadge status={c.status} />
                </Card>
              </Link>
            ))}
          </div>

          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add customer">
        <CustomerForm
          onSubmit={(payload) => createCustomer.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
