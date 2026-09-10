"use client";

import { useState } from "react";
import { TopBar } from "@/components/layout/TopBar";
import { Skeleton } from "@/components/ui/Skeleton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { SelectionBar } from "@/components/ui/SelectionBar";
import { SelectRow } from "@/components/ui/SelectRow";
import { SearchIcon } from "@/components/admin/icons";
import { useDebouncedValue } from "@/lib/hooks/useDebouncedValue";
import { useInfiniteScrollSentinel } from "@/lib/hooks/useInfiniteScrollSentinel";
import { useCustomersManage } from "@/lib/hooks/useCustomersManage";
import { useBulkDeleteCustomers } from "@/lib/hooks/useCustomerMutations";
import { useBulkDeleteUsers, useCurrentUser, useStaffDirectory } from "@/lib/hooks/useUsers";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

type Tab = "customers" | "salesman";

function CustomersPanel() {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCustomersManage(debouncedSearch);
  const sentinelRef = useInfiniteScrollSentinel(() => fetchNextPage(), !!hasNextPage);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];
  const customers = Array.from(new Map(allItems.map((c) => [c.id, c])).values());

  const bulkDelete = useBulkDeleteCustomers();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === customers.length) setSelected(new Set());
    else setSelected(new Set(customers.map((c) => c.id)));
  }

  async function handleDelete() {
    await bulkDelete.mutateAsync(Array.from(selected));
    setSelected(new Set());
    setConfirmOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search customers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>
        {customers.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            {selected.size === customers.length ? "Deselect all" : `Select all on this page (${customers.length})`}
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-3 pb-28 sm:px-6 sm:pb-6">
        {isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {!isLoading && customers.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No customers found.</p>
        )}

        <div className="flex flex-col gap-2">
          {customers.map((customer) => (
            <SelectRow
              key={customer.id}
              checked={selected.has(customer.id)}
              onToggle={() => toggle(customer.id)}
              title={customer.business_name}
              subtitle={`${customer.mobile} · ${customer.city}`}
            />
          ))}
        </div>

        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && <p className="text-xs text-ink-muted">Loading more…</p>}
        </div>
      </div>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirmOpen(true)}
        isDeleting={bulkDelete.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} customer${selected.size === 1 ? "" : "s"}?`}
        message="These customers will lose access immediately. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={bulkDelete.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

function SalesmanPanel() {
  const staffDirectory = useStaffDirectory();
  const currentUser = useCurrentUser();
  const [search, setSearch] = useState("");
  // Admins double as salesmen for the ordering screens (see AdminCustomersPage's
  // "Salesman" tab), so they're listed here too.
  const salesmen = (staffDirectory.data ?? []).filter((u) => u.role === "salesman" || u.role === "admin");
  const filtered = salesmen.filter((s) => {
    const query = search.trim().toLowerCase();
    if (!query) return true;
    return s.full_name.toLowerCase().includes(query) || s.mobile.includes(query);
  });

  const bulkDelete = useBulkDeleteUsers();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectableIds = filtered.filter((s) => s.id !== currentUser.data?.id).map((s) => s.id);

  function toggleAll() {
    if (selected.size === selectableIds.length) setSelected(new Set());
    else setSelected(new Set(selectableIds));
  }

  async function handleDelete() {
    await bulkDelete.mutateAsync(Array.from(selected));
    setSelected(new Set());
    setConfirmOpen(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 sm:px-6">
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            placeholder="Search salesmen..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-border bg-surface pl-10 pr-3.5 text-sm text-ink placeholder:text-ink-muted/70 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary-soft"
          />
        </div>
        {selectableIds.length > 0 && (
          <button
            type="button"
            onClick={toggleAll}
            className="self-start text-sm font-medium text-primary hover:underline"
          >
            {selected.size === selectableIds.length ? "Deselect all" : `Select all (${selectableIds.length})`}
          </button>
        )}
      </div>

      <div className="flex-1 px-4 py-3 pb-28 sm:px-6 sm:pb-6">
        {staffDirectory.isLoading && (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[60px] w-full rounded-xl" />
            ))}
          </div>
        )}

        {!staffDirectory.isLoading && filtered.length === 0 && (
          <p className="py-10 text-center text-sm text-ink-muted">No salesmen found.</p>
        )}

        <div className="flex flex-col gap-2">
          {filtered.map((salesman) => (
            <SelectRow
              key={salesman.id}
              checked={selected.has(salesman.id)}
              onToggle={() => toggle(salesman.id)}
              title={salesman.full_name}
              subtitle={salesman.mobile}
              disabled={salesman.id === currentUser.data?.id}
              trailing={
                salesman.id === currentUser.data?.id && (
                  <span className="shrink-0 text-xs font-medium text-ink-muted">You</span>
                )
              }
            />
          ))}
        </div>
      </div>

      <SelectionBar
        count={selected.size}
        onClear={() => setSelected(new Set())}
        onDelete={() => setConfirmOpen(true)}
        isDeleting={bulkDelete.isPending}
      />

      <ConfirmDialog
        open={confirmOpen}
        title={`Delete ${selected.size} salesman${selected.size === 1 ? "" : "s"}?`}
        message="These salesman logins will be removed immediately. This can't be undone."
        confirmLabel="Delete"
        tone="danger"
        isConfirming={bulkDelete.isPending}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}

export default function CustomerSettingsPage() {
  useRoleGuard(["admin"]);
  const [tab, setTab] = useState<Tab>("customers");

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Customer Settings" backHref="/admin/customers" />

      <div className="border-b border-border bg-white px-4 pb-4 pt-4 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-ink">Customer Settings</h1>
        <p className="mt-0.5 text-sm text-ink-muted">Bulk delete customers or salesmen</p>

        <div className="mt-4 flex gap-1 rounded-xl bg-surface p-1">
          <button
            type="button"
            onClick={() => setTab("customers")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "customers" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Customer
          </button>
          <button
            type="button"
            onClick={() => setTab("salesman")}
            className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
              tab === "salesman" ? "bg-white text-ink shadow-sm" : "text-ink-muted"
            }`}
          >
            Salesman
          </button>
        </div>
      </div>

      {tab === "customers" ? <CustomersPanel /> : <SalesmanPanel />}
    </div>
  );
}
