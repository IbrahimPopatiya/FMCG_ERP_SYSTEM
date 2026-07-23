"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { CashierTopBar } from "@/components/cashier/CashierTopBar";
import { UsersIcon } from "@/components/cashier/icons";
import { useCustomersManage } from "@/lib/hooks/useCustomersManage";
import { useCustomerDuesById } from "@/lib/hooks/useCustomerDues";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { formatCurrency } from "@/lib/utils/format";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";
import type { CustomerListItem } from "@/types/customers";

function BalanceRow({ customer }: { customer: CustomerListItem }) {
  const dues = useCustomerDuesById(customer.id);

  return (
    <Link href={`/admin/customers/${customer.id}`}>
      <Card className="flex items-center gap-3 transition-colors hover:border-primary/50">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary">
          <UsersIcon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium text-ink">{customer.business_name}</p>
          <p className="text-xs text-ink-muted">{customer.customer_code} • {customer.city}</p>
        </div>
        <div className="shrink-0 text-right">
          {dues.isLoading ? (
            <Skeleton className="h-6 w-20" />
          ) : (dues.data?.total_due ?? 0) > 0 ? (
            <>
              <p className="text-sm font-semibold text-ink">{formatCurrency(dues.data?.total_due ?? 0)}</p>
              <Badge tone="warning">Credit</Badge>
            </>
          ) : (
            <Badge tone="success">Clear</Badge>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function PartyBalancePage() {
  useRoleGuard(["admin", "cashier", "manager"]);

  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCustomersManage(search);

  const customers = data?.pages.flatMap((page) => page.items) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  return (
    <div>
      <CashierTopBar title="Party Balance" subtitle={total > 0 ? `${total} customer${total === 1 ? "" : "s"}` : "Outstanding dues"} />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customer…"
          className="h-11 w-full rounded-lg border border-border bg-white px-3.5 text-sm text-ink outline-none placeholder:text-ink-muted focus:border-primary focus:ring-1 focus:ring-primary sm:max-w-sm"
        />
      </header>

      {isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load customers.
            <button type="button" onClick={() => refetch()} className="underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {!isLoading && !isError && customers.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No customers found</p>
          <p className="text-sm text-ink-muted">Try a different search.</p>
        </div>
      )}

      {!isLoading && !isError && customers.length > 0 && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {customers.map((customer) => (
            <BalanceRow key={customer.id} customer={customer} />
          ))}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {isFetchingNextPage && <Badge tone="neutral">Loading more…</Badge>}
          </div>
        </div>
      )}
    </div>
  );
}
