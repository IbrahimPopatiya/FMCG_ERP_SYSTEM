"use client";

import { useState } from "react";
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
import { useCreateCustomer } from "@/lib/hooks/useCustomerMutations";
import { useCustomersManage } from "@/lib/hooks/useCustomersManage";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency } from "@/lib/utils/format";
import type { CustomerListItem } from "@/types/customers";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

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

export default function AdminCustomersPage() {
  useRoleGuard(["admin", "salesman", "manager", "cashier"]);

  const [search, setSearch] = useState("");
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

  const customers = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  return (
    <div>
      <TopBar title="Customers" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Customers</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {total > 0 ? `${total} customer${total === 1 ? "" : "s"}` : "Shops and retailers you sell to"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add customer
        </Button>
      </header>

      <div className="px-4 pt-4 sm:px-6">
        <input
          type="search"
          placeholder="Search by name, mobile or code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 w-full max-w-sm rounded-lg border border-border px-3.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft"
        />
      </div>

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
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
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

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {customers.map((c) => (
              <Link key={c.id} href={`/admin/customers/${c.id}`}>
                <Card className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{c.business_name}</p>
                    <p className="font-mono text-xs text-ink-muted">{c.customer_code}</p>
                    <p className="mt-1 text-sm text-ink-muted">{c.mobile}</p>
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
