"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { AdminTopBar, AdminIconButton } from "@/components/admin/AdminTopBar";
import { SearchIcon, FilterIcon } from "@/components/admin/icons";
import { SupplierForm } from "@/components/suppliers/SupplierForm";
import { SupplierStatusBadge } from "@/components/suppliers/SupplierStatusBadge";
import { useCreateSupplier, useSetSupplierStatus } from "@/lib/hooks/useSupplierMutations";
import { useSuppliers } from "@/lib/hooks/useSuppliers";
import { usePurchasesManage } from "@/lib/hooks/usePurchases";
import { formatCurrency } from "@/lib/utils/format";
import type { SupplierResponse } from "@/types/suppliers";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

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
  useRoleGuard(["admin", "manager"]);

  const [isFormOpen, setFormOpen] = useState(false);
  const suppliers = useSuppliers();
  const purchases = usePurchasesManage();
  const createSupplier = useCreateSupplier();
  const setStatus = useSetSupplierStatus();

  const rows = suppliers.data ?? [];
  const allPurchases = purchases.data?.pages.flatMap((p) => p.items) ?? [];
  const totalPurchasedBySupplier = (supplierId: string) =>
    allPurchases.filter((p) => p.supplier_id === supplierId).reduce((sum, p) => sum + p.total, 0);

  return (
    <div className="pb-24">
      <AdminTopBar
        title="Suppliers"
        subtitle={rows.length > 0 ? `${rows.length} supplier${rows.length === 1 ? "" : "s"}` : "Vendors you buy stock from"}
        back
        right={
          <>
            <AdminIconButton label="Search"><SearchIcon className="h-5 w-5" /></AdminIconButton>
            <AdminIconButton label="Filter"><FilterIcon className="h-5 w-5" /></AdminIconButton>
          </>
        }
      />

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
                    <p className="text-xs text-ink-muted">{s.address}</p>
                    <p className="mt-1 text-xs text-ink-muted">
                      Total Purchases: {formatCurrency(totalPurchasedBySupplier(s.id))}
                    </p>
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

      <div className="fixed inset-x-4 bottom-20 sm:absolute sm:inset-x-6 sm:bottom-6">
        <Button type="button" className="w-full" onClick={() => setFormOpen(true)}>
          + Add Supplier
        </Button>
      </div>

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add supplier">
        <SupplierForm
          onSubmit={(payload) => createSupplier.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
