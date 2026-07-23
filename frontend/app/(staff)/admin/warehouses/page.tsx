"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { WarehouseForm } from "@/components/warehouses/WarehouseForm";
import { WarehouseStatusBadge } from "@/components/warehouses/WarehouseStatusBadge";
import { useSetWarehouseStatus, useCreateWarehouse } from "@/lib/hooks/useWarehouseMutations";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { WarehouseResponse } from "@/types/warehouses";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">No warehouses yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add the warehouses that fulfil orders and hold stock.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add warehouse
      </Button>
    </div>
  );
}

export default function WarehousesPage() {
  useRoleGuard(["admin"]);

  const [isFormOpen, setFormOpen] = useState(false);
  const warehouses = useWarehouses();
  const createWarehouse = useCreateWarehouse();
  const setStatus = useSetWarehouseStatus();

  const rows = warehouses.data ?? [];

  return (
    <div>
      <TopBar title="Warehouses" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Warehouses</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} warehouse${rows.length === 1 ? "" : "s"}` : "Stock locations"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add warehouse
        </Button>
      </header>

      {warehouses.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {warehouses.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load warehouses.
            <Button type="button" variant="secondary" onClick={() => warehouses.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!warehouses.isLoading && !warehouses.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!warehouses.isLoading && !warehouses.isError && rows.length > 0 && (
        <div className="p-4 sm:p-6">
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<WarehouseResponse>
                rowKey={(w) => w.id}
                rows={rows}
                columns={[
                  { header: "Warehouse", render: (w) => <p className="font-medium text-ink">{w.name}</p> },
                  { header: "State", render: (w) => w.state },
                  { header: "Address", render: (w) => w.address },
                  { header: "Status", render: (w) => <WarehouseStatusBadge status={w.status} /> },
                  {
                    header: "",
                    render: (w) => (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3 text-xs"
                          isLoading={setStatus.isPending && setStatus.variables?.warehouseId === w.id}
                          onClick={() =>
                            setStatus.mutate({
                              warehouseId: w.id,
                              status: w.status === "active" ? "inactive" : "active",
                            })
                          }
                        >
                          {w.status === "active" ? "Deactivate" : "Activate"}
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((w) => (
              <Card key={w.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{w.name}</p>
                    <p className="text-xs text-ink-muted">{w.state}</p>
                  </div>
                  <WarehouseStatusBadge status={w.status} />
                </div>
                <div className="flex justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-9 px-3 text-xs"
                    onClick={() =>
                      setStatus.mutate({
                        warehouseId: w.id,
                        status: w.status === "active" ? "inactive" : "active",
                      })
                    }
                  >
                    {w.status === "active" ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add warehouse">
        <WarehouseForm
          onSubmit={(payload) => createWarehouse.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
