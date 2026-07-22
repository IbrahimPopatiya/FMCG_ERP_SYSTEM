"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Select } from "@/components/ui/Select";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { RouteForm } from "@/components/routes/RouteForm";
import { useStaffDirectory } from "@/lib/hooks/useUsers";
import { useAssignRouteSalesman, useCreateRoute, useDeleteRoute } from "@/lib/hooks/useRouteMutations";
import { useRoutes } from "@/lib/hooks/useRoutes";
import type { RouteResponse } from "@/types/salesRoutes";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">No routes yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add sales routes and assign a salesman to each so orders can be scoped correctly.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add route
      </Button>
    </div>
  );
}

export default function RoutesPage() {
  const [isFormOpen, setFormOpen] = useState(false);
  const routes = useRoutes();
  const staff = useStaffDirectory();
  const createRoute = useCreateRoute();
  const assignSalesman = useAssignRouteSalesman();
  const deleteRoute = useDeleteRoute();

  const rows = routes.data ?? [];
  const salesmen = (staff.data ?? []).filter((u) => u.role === "salesman");
  const salesmanNameById = new Map(salesmen.map((s) => [s.id, s.full_name]));

  return (
    <div>
      <TopBar title="Routes" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Routes</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} route${rows.length === 1 ? "" : "s"}` : "Sales routes"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add route
        </Button>
      </header>

      {routes.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {routes.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load routes.
            <Button type="button" variant="secondary" onClick={() => routes.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!routes.isLoading && !routes.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!routes.isLoading && !routes.isError && rows.length > 0 && (
        <div className="p-4 sm:p-6">
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<RouteResponse>
                rowKey={(r) => r.id}
                rows={rows}
                columns={[
                  { header: "Route", render: (r) => <p className="font-medium text-ink">{r.name}</p> },
                  {
                    header: "Salesman",
                    render: (r) => (
                      <div className="w-48">
                        <Select
                          value={r.salesman_id ?? ""}
                          onValueChange={(salesmanId) => assignSalesman.mutate({ routeId: r.id, salesmanId })}
                          placeholder="Unassigned"
                          options={salesmen.map((s) => ({ value: s.id, label: s.full_name }))}
                        />
                      </div>
                    ),
                  },
                  { header: "Status", render: (r) => <Badge tone={r.status === "active" ? "success" : "neutral"}>{r.status}</Badge> },
                  {
                    header: "",
                    render: (r) => (
                      <div className="flex justify-end">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-9 px-3 text-xs"
                          isLoading={deleteRoute.isPending && deleteRoute.variables === r.id}
                          onClick={() => deleteRoute.mutate(r.id)}
                        >
                          Delete
                        </Button>
                      </div>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:hidden">
            {rows.map((r) => (
              <Card key={r.id} className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{r.name}</p>
                    <p className="text-xs text-ink-muted">
                      {r.salesman_id ? salesmanNameById.get(r.salesman_id) ?? "—" : "Unassigned"}
                    </p>
                  </div>
                  <Badge tone={r.status === "active" ? "success" : "neutral"}>{r.status}</Badge>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add route">
        <RouteForm salesmen={salesmen} onSubmit={(payload) => createRoute.mutateAsync(payload)} onSuccess={() => setFormOpen(false)} />
      </Modal>
    </div>
  );
}
