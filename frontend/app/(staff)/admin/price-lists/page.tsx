"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { PriceListForm } from "@/components/priceLists/PriceListForm";
import { useCreatePriceList, useDeletePriceList } from "@/lib/hooks/usePriceListMutations";
import { usePriceLists } from "@/lib/hooks/usePriceLists";
import { useRoleGuard } from "@/lib/hooks/useRoleGuard";

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
      <h2 className="text-base font-semibold text-ink">No price lists yet</h2>
      <p className="max-w-sm text-sm text-ink-muted">
        Add a price list, then assign per-product discounts and link it to customers.
      </p>
      <Button type="button" className="mt-1" onClick={onAdd}>
        Add price list
      </Button>
    </div>
  );
}

export default function PriceListsPage() {
  useRoleGuard(["admin"]);

  const [isFormOpen, setFormOpen] = useState(false);
  const priceLists = usePriceLists();
  const createPriceList = useCreatePriceList();
  const deletePriceList = useDeletePriceList();

  const rows = priceLists.data ?? [];

  return (
    <div>
      <TopBar title="Price Lists" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">Price Lists</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} price list${rows.length === 1 ? "" : "s"}` : "Customer-specific pricing"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add price list
        </Button>
      </header>

      {priceLists.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {priceLists.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load price lists.
            <Button type="button" variant="secondary" onClick={() => priceLists.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!priceLists.isLoading && !priceLists.isError && rows.length === 0 && (
        <EmptyState onAdd={() => setFormOpen(true)} />
      )}

      {!priceLists.isLoading && !priceLists.isError && rows.length > 0 && (
        <div className="grid grid-cols-1 gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {rows.map((pl) => (
            <Card key={pl.id} className="flex flex-col gap-3">
              <Link href={`/admin/price-lists/${pl.id}`} className="min-w-0">
                <p className="truncate font-medium text-ink">{pl.name}</p>
                <p className="truncate text-xs text-ink-muted">{pl.description ?? "No description"}</p>
              </Link>
              <div className="flex justify-end gap-2">
                <Link href={`/admin/price-lists/${pl.id}`}>
                  <Button type="button" variant="secondary" className="h-9 px-3 text-xs">
                    Manage items
                  </Button>
                </Link>
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9 px-3 text-xs"
                  isLoading={deletePriceList.isPending && deletePriceList.variables === pl.id}
                  onClick={() => deletePriceList.mutate(pl.id)}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add price list">
        <PriceListForm
          onSubmit={(payload) => createPriceList.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
