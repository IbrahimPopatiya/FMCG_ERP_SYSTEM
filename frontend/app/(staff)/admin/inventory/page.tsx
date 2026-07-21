"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Table } from "@/components/ui/Table";
import { TopBar } from "@/components/layout/TopBar";
import { AdjustStockForm } from "@/components/inventory/AdjustStockForm";
import { TransferStockForm } from "@/components/inventory/TransferStockForm";
import { useCreateInventoryAdjustment, useCreateInventoryTransfer } from "@/lib/hooks/useInventoryMutations";
import { useInventory } from "@/lib/hooks/useInventory";
import { useProductStockList } from "@/lib/hooks/useProductStockList";
import { useWarehouses } from "@/lib/hooks/useWarehouses";
import type { InventoryResponse } from "@/types/inventory";

interface InventoryRow extends InventoryResponse {
  productName: string;
  productSku: string;
  minimumStock: number;
  warehouseName: string;
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

export default function InventoryPage() {
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState<string>("all");
  const [showAdjust, setShowAdjust] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);

  const inventory = useInventory();
  const warehouses = useWarehouses();
  const products = useProductStockList();
  const createAdjustment = useCreateInventoryAdjustment();
  const createTransfer = useCreateInventoryTransfer();

  const isLoading = inventory.isLoading || warehouses.isLoading || products.isLoading;
  const isError = inventory.isError || warehouses.isError || products.isError;

  const rows: InventoryRow[] = useMemo(() => {
    const productMap = new Map((products.data?.items ?? []).map((p) => [p.id, p]));
    const warehouseMap = new Map((warehouses.data ?? []).map((w) => [w.id, w]));

    return (inventory.data ?? []).map((row) => {
      const product = productMap.get(row.product_id);
      const warehouse = warehouseMap.get(row.warehouse_id);
      return {
        ...row,
        productName: product?.name ?? "Product",
        productSku: product?.sku ?? "",
        minimumStock: product?.minimum_stock ?? 0,
        warehouseName: warehouse?.name ?? "Warehouse",
      };
    });
  }, [inventory.data, products.data, warehouses.data]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter((row) => {
      if (warehouseFilter !== "all" && row.warehouse_id !== warehouseFilter) return false;
      if (!query) return true;
      return row.productName.toLowerCase().includes(query) || row.productSku.toLowerCase().includes(query);
    });
  }, [rows, search, warehouseFilter]);

  return (
    <div>
      <TopBar title="Inventory" />

      <header className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-white px-4 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-ink">Inventory</h1>
            <p className="mt-0.5 text-sm text-ink-muted">Stock on hand across every warehouse</p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" className="flex-1 sm:flex-none" onClick={() => setShowTransfer(true)}>
              Transfer stock
            </Button>
            <Button type="button" className="flex-1 sm:flex-none" onClick={() => setShowAdjust(true)}>
              Adjust stock
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            placeholder="Search by product name or SKU…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full flex-1 rounded-lg border border-border px-3.5 text-sm text-ink placeholder:text-ink-muted/60 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary-soft"
          />
          <div className="sm:w-56">
            <Select
              value={warehouseFilter}
              onValueChange={setWarehouseFilter}
              options={[
                { value: "all", label: "All warehouses" },
                ...(warehouses.data ?? []).map((w) => ({ value: w.id, label: w.name })),
              ]}
            />
          </div>
        </div>
      </header>

      {isLoading && <SkeletonRows />}

      {isError && (
        <div className="p-4 sm:p-6">
          <div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700">
            Couldn&apos;t load inventory.
          </div>
        </div>
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <div className="flex flex-col items-center gap-2 px-4 py-16 text-center">
          <p className="text-sm font-medium text-ink">No stock records found</p>
          <p className="text-sm text-ink-muted">Try a different search or warehouse.</p>
        </div>
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="p-4 sm:p-6">
          {/* Desktop: full data table */}
          <div className="hidden sm:block">
            <div className="overflow-hidden rounded-lg border border-border bg-white shadow-sm">
              <Table<InventoryRow>
                rowKey={(r) => `${r.warehouse_id}-${r.product_id}`}
                rows={filtered}
                columns={[
                  {
                    header: "Product",
                    render: (r) => (
                      <div>
                        <p className="font-medium text-ink">{r.productName}</p>
                        <p className="font-mono text-xs text-ink-muted">{r.productSku}</p>
                      </div>
                    ),
                  },
                  { header: "Warehouse", render: (r) => r.warehouseName },
                  { header: "Physical", render: (r) => r.physical_stock },
                  { header: "Reserved", render: (r) => r.reserved_stock },
                  { header: "Damaged", render: (r) => r.damaged_stock },
                  { header: "Expired", render: (r) => r.expiry_stock },
                  {
                    header: "Sellable",
                    render: (r) => (
                      <Badge tone={r.sellable_stock <= r.minimumStock ? "danger" : "success"}>
                        {r.sellable_stock}
                      </Badge>
                    ),
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile: simplified card list */}
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((r) => (
              <Card key={`${r.warehouse_id}-${r.product_id}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{r.productName}</p>
                  <p className="font-mono text-xs text-ink-muted">{r.productSku}</p>
                  <p className="mt-1 text-xs text-ink-muted">{r.warehouseName}</p>
                </div>
                <Badge tone={r.sellable_stock <= r.minimumStock ? "danger" : "success"}>
                  {r.sellable_stock} sellable
                </Badge>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Modal open={showAdjust} onClose={() => setShowAdjust(false)} title="Adjust stock">
        <AdjustStockForm
          onSubmit={(payload) => createAdjustment.mutateAsync(payload)}
          onSuccess={() => setShowAdjust(false)}
        />
      </Modal>

      <Modal open={showTransfer} onClose={() => setShowTransfer(false)} title="Transfer stock">
        <TransferStockForm
          onSubmit={(payload) => createTransfer.mutateAsync(payload)}
          onSuccess={() => setShowTransfer(false)}
        />
      </Modal>
    </div>
  );
}
