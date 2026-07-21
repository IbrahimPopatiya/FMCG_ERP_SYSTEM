"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";
import { useCreateSupplier, useSetSupplierStatus } from "@/lib/hooks/useSupplierMutations";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import type { SupplierResponse } from "@/types/suppliers";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-soft text-primary">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path
            d="M3 9l9-6 9 6-9 6-9-6zm0 6l9 6 9-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-ink">No suppliers yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add the vendors you buy stock from so purchases can be recorded against them.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add supplier
      </Button>
    </div>
  );
}

export default function SuppliersPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const suppliers = useSuppliers();
  const createSupplier = useCreateSupplier();
  const setStatus = useSetSupplierStatus();

  const rows = suppliers.data ?? [];

  return (
    <div>
      <TopBar title="Suppliers" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Suppliers</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} supplier${rows.length === 1 ? "" : "s"}` : "Vendors you buy stock from"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add supplier
        </Button>
      </header>

      {suppliers.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {suppliers.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load suppliers.
            <Button type="button" variant="secondary" onClick={() => suppliers.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!suppliers.isLoading && !suppliers.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!suppliers.isLoading && !suppliers.isError && rows.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<SupplierResponse>
                rowKey={(s) => s.id}
                rows={rows}
                columns={[
                  {
                    header: "Supplier",
                    render: (s) => (
                      <div>
                        <p className="font-medium text-ink">{s.name}</p>
                        <p className="font-mono text-xs text-ink-muted">{s.supplier_code}</p>
                      </div>
                    ),
                  },
                  { header: "Mobile", render: (s) => s.mobile },
                  { header: "GST number", render: (s) => s.gst_number ?? "—" },
                  { header: "Status", render: (s) => <SupplierStatusBadge status={s.status} /> },
                  {
                    header: "",
                    render: (s) => (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3 text-xs"
                          isLoading={setStatus.isPending && setStatus.variables?.supplierId === s.id}
                          onClick={() =>
                            setStatus.mutate({
                              supplierId: s.id,
                              status: s.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {s.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((s) => (
              <Card key={s.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{s.name}</p>
                    <p className="font-mono text-xs text-ink-muted">{s.supplier_code}</p>
                    <p className="text-xs text-ink-muted">{s.mobile}</p>
                  </div>
                  <SupplierStatusBadge status={s.status} />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={() =>
                      setStatus.mutate({
                        supplierId: s.id,
                        status: s.status === "active" ? "inactive" : "active",
                      })
                    }
                  >
                    {s.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add supplier">
        <SupplierForm
          onSubmit={(payload) => createSupplier.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
