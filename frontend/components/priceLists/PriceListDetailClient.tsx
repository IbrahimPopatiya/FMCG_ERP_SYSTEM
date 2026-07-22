"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { PriceListItemForm } from "@/components/priceLists/PriceListItemForm";
import { useProducts } from "@/lib/hooks/useProducts";
import {
  useAddPriceListItem,
  useRemovePriceListItem,
  useUpdatePriceListItem,
} from "@/lib/hooks/usePriceListMutations";
import { usePriceList, usePriceListItems } from "@/lib/hooks/usePriceLists";
import type { PriceListItemResponse } from "@/types/priceLists";

export function PriceListDetailClient({ priceListId }: { priceListId: string }) {
  const [isFormOpen, setFormOpen] = useState(false);
  const [draftDiscount, setDraftDiscount] = useState<Record<string, string>>({});

  const priceList = usePriceList(priceListId);
  const items = usePriceListItems(priceListId);
  const products = useProducts();
  const addItem = useAddPriceListItem(priceListId);
  const updateItem = useUpdatePriceListItem(priceListId);
  const removeItem = useRemovePriceListItem(priceListId);

  const productNameById = new Map((products.data ?? []).map((p) => [p.id, p.name]));
  const rows = items.data ?? [];

  return (
    <div>
      <TopBar title={priceList.data?.name ?? "Price list"} />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-ink">{priceList.data?.name ?? "Price list"}</h1>
          <p className="mt-0.5 text-sm text-ink-muted">
            {rows.length > 0 ? `${rows.length} product${rows.length === 1 ? "" : "s"}` : "Per-product discounts"}
          </p>
        </div>
        <Button type="button" className="w-full sm:w-auto" onClick={() => setFormOpen(true)}>
          Add product
        </Button>
      </header>

      {items.isLoading && (
        <div className="flex flex-col gap-3 p-4 sm:p-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      )}

      {items.isError && (
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load this price list&apos;s items.
            <Button type="button" variant="secondary" onClick={() => items.refetch()}>
              Retry
            </Button>
          </div>
        </div>
      )}

      {!items.isLoading && !items.isError && rows.length === 0 && (
        <p className="px-4 py-16 text-center text-sm text-ink-muted sm:px-6">
          No products in this price list yet.
        </p>
      )}

      {!items.isLoading && !items.isError && rows.length > 0 && (
        <div className="p-4 sm:p-6">
          <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
            <Table<PriceListItemResponse>
              rowKey={(item) => item.id}
              rows={rows}
              columns={[
                {
                  header: "Product",
                  render: (item) => productNameById.get(item.product_id) ?? item.product_id,
                },
                {
                  header: "Discount %",
                  render: (item) => (
                    <div className="flex w-32 items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        value={draftDiscount[item.id] ?? String(item.discount_percent)}
                        onChange={(e) =>
                          setDraftDiscount((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                      />
                    </div>
                  ),
                },
                {
                  header: "",
                  render: (item) => (
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        isLoading={updateItem.isPending && updateItem.variables?.itemId === item.id}
                        onClick={() =>
                          updateItem.mutate({
                            itemId: item.id,
                            discountPercent: Number(draftDiscount[item.id] ?? item.discount_percent),
                          })
                        }
                      >
                        Save
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9 px-3 text-xs"
                        isLoading={removeItem.isPending && removeItem.variables === item.id}
                        onClick={() => removeItem.mutate(item.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </div>
      )}

      <Modal open={isFormOpen} onClose={() => setFormOpen(false)} title="Add product">
        <PriceListItemForm
          products={products.data ?? []}
          onSubmit={(payload) => addItem.mutateAsync(payload)}
          onSuccess={() => setFormOpen(false)}
        />
      </Modal>
    </div>
  );
}
